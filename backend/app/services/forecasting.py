from typing import Dict, Any, Optional, List
from app.services.artifacts import ArtifactService
import numpy as np
from datetime import datetime, timedelta

class ForecastingService:
    """
    Service for retrieving forecast data and metrics.
    Integrates with timeseries-forecaster artifacts.
    """
    
    def __init__(self):
        self.artifact_service = ArtifactService()
    
    def get_series_metadata(self) -> Dict[str, Any]:
        """
        Get dataset metadata and list of available series.
        """
        # In a real implementation, this would read from a metadata file
        return {
            "dataset_name": "default_series",
            "series": [
                {
                    "id": "series_1",
                    "name": "Default Time Series",
                    "description": "Main forecasting series"
                }
            ]
        }
    
    def get_forecast(
        self,
        model: str,
        horizon: int,
        fold_id: Optional[int] = None,
        overlay_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Get forecast data for specified model, horizon, and fold.
        Returns history, forecast with quantiles, and metrics.
        """
        # Validate inputs
        if model not in ["arima", "seq2seq_attention_quantile"]:
            raise ValueError(f"Invalid model: {model}")
        
        if horizon not in [1, 7, 14, 30]:
            raise ValueError(f"Invalid horizon: {horizon}")
        
        # Load forecast data from artifacts
        forecast_data = self.artifact_service.load_forecast_data(model, horizon, fold_id)
        
        # If no data found, generate mock data for development
        if not forecast_data.get("history") or not forecast_data.get("forecast"):
            return self._generate_mock_forecast(model, horizon, fold_id)
        
        # Process and format the data
        history = forecast_data.get("history", [])
        forecast = forecast_data.get("forecast", [])
        metrics = forecast_data.get("metrics", {})
        
        # Ensure quantiles are present
        if model == "seq2seq_attention_quantile":
            # Extract quantiles from forecast
            forecast_with_quantiles = self._format_quantile_forecast(forecast)
        else:
            # ARIMA - use mean forecast with estimated confidence intervals
            forecast_with_quantiles = self._format_arima_forecast(forecast)
        
        # Calculate metrics if not present
        if not metrics:
            metrics = self._calculate_metrics(history, forecast_with_quantiles)
        
        return {
            "history": history,
            "forecast_origin": history[-1]["timestamp"] if history else None,
            "forecast": forecast_with_quantiles,
            "metrics": metrics
        }
    
    def _format_quantile_forecast(self, forecast: List[Dict]) -> List[Dict]:
        """Format forecast data to include p10, p50, p90 quantiles."""
        formatted = []
        for item in forecast:
            formatted.append({
                "timestamp": item.get("timestamp"),
                "p10": item.get("p10") or item.get("quantile_0.1") or item.get("lower"),
                "p50": item.get("p50") or item.get("quantile_0.5") or item.get("mean") or item.get("forecast"),
                "p90": item.get("p90") or item.get("quantile_0.9") or item.get("upper")
            })
        return formatted
    
    def _format_arima_forecast(self, forecast: List[Dict]) -> List[Dict]:
        """Format ARIMA forecast with estimated confidence intervals."""
        formatted = []
        for item in forecast:
            mean = item.get("forecast") or item.get("mean") or item.get("p50", 0)
            # Estimate confidence intervals (simplified)
            std = abs(mean * 0.1)  # 10% of mean as std estimate
            formatted.append({
                "timestamp": item.get("timestamp"),
                "p10": mean - 1.28 * std,  # Approximate 80% CI
                "p50": mean,
                "p90": mean + 1.28 * std
            })
        return formatted
    
    def _calculate_metrics(self, history: List[Dict], forecast: List[Dict]) -> Dict[str, Any]:
        """Calculate MAE, RMSE per step and coverage."""
        if not history or not forecast:
            return {
                "mae_per_step": [],
                "rmse_per_step": [],
                "coverage_p10": 0.0,
                "coverage_p90": 0.0
            }
        
        # Extract actuals for forecast period (if available)
        actuals = [h.get("value", 0) for h in history[-len(forecast):]]
        forecasts_p50 = [f.get("p50", 0) for f in forecast]
        
        # Calculate per-step errors
        mae_per_step = []
        rmse_per_step = []
        
        for i in range(min(len(actuals), len(forecasts_p50))):
            error = abs(actuals[i] - forecasts_p50[i])
            mae_per_step.append(error)
            rmse_per_step.append(error ** 2)
        
        rmse_per_step = [np.sqrt(x) for x in rmse_per_step]
        
        # Calculate coverage (if actuals available)
        coverage_p10 = 0.0
        coverage_p90 = 0.0
        if len(actuals) == len(forecast):
            p10_values = [f.get("p10", 0) for f in forecast]
            p90_values = [f.get("p90", 0) for f in forecast]
            coverage_p10 = sum(1 for i in range(len(actuals)) if p10_values[i] <= actuals[i]) / len(actuals)
            coverage_p90 = sum(1 for i in range(len(actuals)) if actuals[i] <= p90_values[i]) / len(actuals)
        
        return {
            "mae_per_step": mae_per_step,
            "rmse_per_step": rmse_per_step,
            "coverage_p10": coverage_p10,
            "coverage_p90": coverage_p90,
            "overall_mae": np.mean(mae_per_step) if mae_per_step else 0.0,
            "overall_rmse": np.sqrt(np.mean(rmse_per_step)) if rmse_per_step else 0.0
        }
    
    def _generate_mock_forecast(self, model: str, horizon: int, fold_id: Optional[int]) -> Dict[str, Any]:
        """Generate mock forecast data for development/testing."""
        base_time = datetime.now() - timedelta(days=100)
        
        # Generate historical data
        history = []
        for i in range(80):
            timestamp = base_time + timedelta(days=i)
            value = 100 + 10 * np.sin(i / 10) + np.random.normal(0, 2)
            history.append({"timestamp": timestamp.isoformat(), "value": value})
        
        # Generate forecast
        forecast = []
        last_value = history[-1]["value"]
        for i in range(horizon):
            timestamp = base_time + timedelta(days=80 + i)
            trend = i * 0.5
            seasonal = 5 * np.sin((80 + i) / 10)
            p50 = last_value + trend + seasonal + np.random.normal(0, 1)
            uncertainty = abs(p50 * 0.15)
            forecast.append({
                "timestamp": timestamp.isoformat(),
                "p10": p50 - 1.28 * uncertainty,
                "p50": p50,
                "p90": p50 + 1.28 * uncertainty
            })
        
        # Mock metrics
        metrics = {
            "mae_per_step": [abs(np.random.normal(2, 0.5)) for _ in range(horizon)],
            "rmse_per_step": [abs(np.random.normal(2.5, 0.5)) for _ in range(horizon)],
            "coverage_p10": 0.85,
            "coverage_p90": 0.92,
            "overall_mae": 2.1,
            "overall_rmse": 2.6
        }
        
        return {
            "history": history,
            "forecast_origin": history[-1]["timestamp"],
            "forecast": forecast,
            "metrics": metrics
        }

