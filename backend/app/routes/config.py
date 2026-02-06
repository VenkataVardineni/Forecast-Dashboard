from fastapi import APIRouter, HTTPException
from app.services.artifacts import ArtifactService

router = APIRouter()
artifact_service = ArtifactService()


@router.get("")
async def get_config():
    """
    Returns configuration for available models, horizons, quantiles, and folds.
    """
    try:
        config_data = {
            "models": ["arima", "seq2seq_attention_quantile"],
            "horizons": [1, 7, 14, 30],
            "quantiles": [0.1, 0.5, 0.9],
            "folds_available": artifact_service.get_available_folds()
        }
        return config_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading config: {str(e)}")

