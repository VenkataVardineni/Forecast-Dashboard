from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.runs import RunService
import asyncio
import json

router = APIRouter()
run_service = RunService()


class RunStartRequest(BaseModel):
    model: str
    horizon: int
    fold_id: Optional[int] = None


@router.post("/start")
async def start_run(request: RunStartRequest):
    """
    Start a background evaluation run.
    Returns run_id for tracking.
    """
    try:
        run_id = run_service.start_run(
            model=request.model,
            horizon=request.horizon,
            fold_id=request.fold_id
        )
        return {"run_id": run_id, "status": "queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting run: {str(e)}")


@router.get("/{run_id}/stream")
async def stream_run(run_id: str):
    """
    Server-Sent Events endpoint for live run logs and progress.
    """
    async def event_generator():
        try:
            async for event in run_service.stream_run(run_id):
                yield f"data: {event}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/{run_id}/status")
async def get_run_status(run_id: str):
    """
    Get current status of a run.
    """
    try:
        status = run_service.get_run_status(run_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Run not found: {str(e)}")

