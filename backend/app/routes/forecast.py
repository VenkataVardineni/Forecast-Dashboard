from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.services.forecasting import ForecastingService

router = APIRouter()
forecasting_service = ForecastingService()


class ForecastQuery(BaseModel):
    model: str
    horizon: int
    fold_id: Optional[int] = None
    overlay_mode: Optional[bool] = False


@router.get("/series")
async def get_series():
    """
    Returns dataset metadata and list of available series.
    """
    try:
        series_data = forecasting_service.get_series_metadata()
        return series_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading series: {str(e)}")


@router.post("/query")
async def query_forecast(query: ForecastQuery):
    """
    Query forecast data with specified model, horizon, and fold.
    Returns historical data, forecast with quantiles, and metrics.
    """
    try:
        result = forecasting_service.get_forecast(
            model=query.model,
            horizon=query.horizon,
            fold_id=query.fold_id,
            overlay_mode=query.overlay_mode
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading forecast: {str(e)}")

