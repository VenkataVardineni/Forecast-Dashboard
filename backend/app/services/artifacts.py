import os
import json
import csv
from pathlib import Path
from typing import List, Dict, Any, Optional
import glob

class ArtifactService:
    """
    Service for loading artifacts produced by timeseries-forecaster.
    Assumes artifacts are in reports/<run_id>/ structure.
    """
    
    def __init__(self, reports_dir: str = None):
        self.reports_dir = Path(reports_dir or os.getenv("FORECAST_REPORTS_DIR", "./reports"))
        self.reports_dir.mkdir(parents=True, exist_ok=True)
    
    def get_available_folds(self) -> List[int]:
        """
        Scan reports directory for available fold IDs.
        Returns list of fold IDs found in reports.
        """
        folds = set()
        
        # Look for folds.json files
        for folds_file in self.reports_dir.rglob("folds.json"):
            try:
                with open(folds_file, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'folds' in data:
                        for fold_data in data['folds']:
                            if 'fold' in fold_data:
                                folds.add(fold_data['fold'])
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and 'fold' in item:
                                folds.add(item['fold'])
            except:
                continue
        
        # Also check predictions.csv for fold information
        for pred_file in self.reports_dir.rglob("predictions.csv"):
            try:
                with open(pred_file, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if 'fold' in row:
                            folds.add(int(row['fold']))
            except:
                continue
        
        return sorted(list(folds)) if folds else [0, 1, 2, 3, 4]  # Default folds
    
    def load_report(self, run_id: str = None, fold_id: int = None) -> Dict[str, Any]:
        """
        Load a report file. If run_id is provided, load from that run's directory.
        Otherwise, load the latest report.
        """
        if run_id:
            report_path = self.reports_dir / run_id / "report.json"
        else:
            # Find latest report
            report_files = list(self.reports_dir.rglob("report.json"))
            if not report_files:
                return {}
            report_path = max(report_files, key=lambda p: p.stat().st_mtime)
        
        if not report_path.exists():
            return {}
        
        try:
            with open(report_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            return {}
    
    def load_forecast_data(self, model: str, horizon: int, fold_id: int = None) -> Dict[str, Any]:
        """
        Load forecast data for a specific model, horizon, and fold.
        Loads from predictions.csv and metrics CSV files.
        """
        # Find the most recent run directory for this model
        model_runs = []
        for run_dir in self.reports_dir.iterdir():
            if run_dir.is_dir() and model.replace('_', '') in run_dir.name.lower():
                model_runs.append(run_dir)
        
        if not model_runs:
            return {"history": [], "forecast": [], "metrics": {}}
        
        # Use the most recent run
        latest_run = max(model_runs, key=lambda p: p.stat().st_mtime)
        predictions_file = latest_run / "predictions.csv"
        metrics_file = latest_run / "metrics_seq2seq.csv"
        
        if not predictions_file.exists():
            return {"history": [], "forecast": [], "metrics": {}}
        
        history = []
        forecast = []
        
        try:
            with open(predictions_file, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    row_fold = int(row.get('fold', -1))
                    if fold_id is not None and row_fold != fold_id:
                        continue
                    
                    timestamp = row.get('timestamp', '')
                    y_true = row.get('y_true')
                    y_pred_p10 = row.get('y_pred_p10')
                    y_pred_p50 = row.get('y_pred_p50')
                    y_pred_p90 = row.get('y_pred_p90')
                    horizon_step = int(row.get('horizon_step', 0))
                    
                    if y_true and y_true != '':
                        try:
                            history.append({
                                "timestamp": timestamp,
                                "value": float(y_true)
                            })
                        except:
                            pass
                    
                    if y_pred_p50 and y_pred_p50 != '' and horizon_step <= horizon:
                        try:
                            forecast.append({
                                "timestamp": timestamp,
                                "p10": float(y_pred_p10) if y_pred_p10 else None,
                                "p50": float(y_pred_p50),
                                "p90": float(y_pred_p90) if y_pred_p90 else None
                            })
                        except:
                            pass
        except Exception as e:
            print(f"Error loading predictions: {e}")
        
        # Load metrics
        metrics = {}
        if metrics_file.exists():
            try:
                with open(metrics_file, 'r') as f:
                    reader = csv.DictReader(f)
                    mae_per_step = []
                    rmse_per_step = []
                    for row in reader:
                        row_fold = int(row.get('fold', -1))
                        if fold_id is not None and row_fold != fold_id:
                            continue
                        try:
                            step = int(row.get('horizon_step', 0))
                            mae = float(row.get('mae', 0))
                            rmse = float(row.get('rmse', 0))
                            if step <= horizon:
                                mae_per_step.append(mae)
                                rmse_per_step.append(rmse)
                        except:
                            pass
                    metrics = {
                        "mae_per_step": mae_per_step,
                        "rmse_per_step": rmse_per_step
                    }
            except Exception as e:
                print(f"Error loading metrics: {e}")
        
        # Load coverage from folds.json
        folds_file = latest_run / "folds.json"
        if folds_file.exists():
            try:
                with open(folds_file, 'r') as f:
                    folds_data = json.load(f)
                    if isinstance(folds_data, dict) and 'folds' in folds_data:
                        for fold_data in folds_data['folds']:
                            if fold_data.get('fold') == fold_id:
                                metrics['coverage_p10'] = 1.0 - fold_data.get('pinball_p10', 0.0)
                                metrics['coverage_p90'] = fold_data.get('coverage', 0.0)
                                break
            except:
                pass
        
        return {
            "history": history,
            "forecast": forecast,
            "metrics": metrics
        }

