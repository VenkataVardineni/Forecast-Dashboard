import os
import json
import asyncio
import uuid
from pathlib import Path
from typing import Dict, Any, AsyncGenerator
from datetime import datetime
from app.services.artifacts import ArtifactService

class RunService:
    """
    Service for managing evaluation runs and streaming logs via SSE.
    """
    
    def __init__(self):
        self.artifact_service = ArtifactService()
        self.active_runs: Dict[str, Dict[str, Any]] = {}
    
    def start_run(self, model: str, horizon: int, fold_id: int = None) -> str:
        """
        Start a background evaluation run.
        Returns run_id for tracking.
        """
        run_id = str(uuid.uuid4())
        
        self.active_runs[run_id] = {
            "run_id": run_id,
            "model": model,
            "horizon": horizon,
            "fold_id": fold_id,
            "status": "queued",
            "progress": 0,
            "created_at": datetime.now().isoformat()
        }
        
        # Start background task
        asyncio.create_task(self._execute_run(run_id))
        
        return run_id
    
    async def _execute_run(self, run_id: str):
        """
        Execute the run in background, updating status and progress.
        In a real implementation, this would call timeseries-forecaster.
        """
        run = self.active_runs.get(run_id)
        if not run:
            return
        
        run["status"] = "running"
        
        # Simulate run execution by replaying logs or running actual evaluation
        # For now, simulate with progress updates
        for progress in range(0, 101, 10):
            await asyncio.sleep(0.5)  # Simulate work
            run["progress"] = progress
        
        run["status"] = "done"
        run["completed_at"] = datetime.now().isoformat()
        run["artifacts"] = {
            "metrics_path": f"/artifacts/{run_id}/metrics.json",
            "plot_path": f"/artifacts/{run_id}/forecast_plot.png"
        }
    
    async def stream_run(self, run_id: str) -> AsyncGenerator[str, None]:
        """
        Stream run logs and progress via Server-Sent Events.
        """
        run = self.active_runs.get(run_id)
        if not run:
            yield json.dumps({"type": "error", "message": "Run not found"})
            return
        
        # Send initial status
        yield json.dumps({
            "type": "status",
            "status": run["status"],
            "progress": run.get("progress", 0)
        })
        
        # Stream logs (simulate or read from actual log file)
        log_messages = [
            f"Starting evaluation for model={run['model']}, horizon={run['horizon']}",
            "Loading historical data...",
            "Training model...",
            "Generating forecasts...",
            "Calculating metrics...",
            "Saving artifacts...",
            "Evaluation complete!"
        ]
        
        for i, message in enumerate(log_messages):
            await asyncio.sleep(1)
            yield json.dumps({
                "type": "log",
                "message": message,
                "timestamp": datetime.now().isoformat()
            })
            
            # Update progress
            progress = int((i + 1) / len(log_messages) * 100)
            run["progress"] = progress
            yield json.dumps({
                "type": "progress",
                "progress": progress
            })
        
        # Send completion
        if run.get("status") == "done":
            yield json.dumps({
                "type": "artifact",
                "metrics_path": run.get("artifacts", {}).get("metrics_path"),
                "plot_path": run.get("artifacts", {}).get("plot_path")
            })
            yield json.dumps({
                "type": "complete",
                "status": "done"
            })
    
    def get_run_status(self, run_id: str) -> Dict[str, Any]:
        """
        Get current status of a run.
        """
        run = self.active_runs.get(run_id)
        if not run:
            raise ValueError(f"Run {run_id} not found")
        
        return {
            "run_id": run_id,
            "status": run["status"],
            "progress": run.get("progress", 0),
            "model": run.get("model"),
            "horizon": run.get("horizon"),
            "fold_id": run.get("fold_id"),
            "artifacts": run.get("artifacts")
        }

