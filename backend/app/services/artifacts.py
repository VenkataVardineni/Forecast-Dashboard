import os
import json
from pathlib import Path
from typing import List, Dict, Any
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
        # Look for report files that might contain fold information
        for report_file in self.reports_dir.rglob("*.json"):
            try:
                with open(report_file, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, dict) and 'fold_id' in data:
                        folds.add(data['fold_id'])
                    elif isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and 'fold_id' in item:
                                folds.add(item['fold_id'])
            except:
                continue
        
        # Also check directory names that might be fold IDs
        for dir_path in self.reports_dir.iterdir():
            if dir_path.is_dir():
                try:
                    fold_id = int(dir_path.name)
                    folds.add(fold_id)
                except ValueError:
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
        This would typically load from a structured artifact file.
        """
        # Look for forecast files matching the pattern
        pattern = f"*{model}*h{horizon}*"
        if fold_id is not None:
            pattern = f"*fold{fold_id}*{pattern}"
        
        forecast_files = list(self.reports_dir.rglob(f"{pattern}.json"))
        
        if forecast_files:
            try:
                with open(forecast_files[0], 'r') as f:
                    return json.load(f)
            except:
                pass
        
        # Return mock structure if no file found (for development)
        return {
            "history": [],
            "forecast": [],
            "metrics": {}
        }

