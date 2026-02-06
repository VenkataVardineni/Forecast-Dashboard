from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import config, forecast, runs

app = FastAPI(
    title="Forecast Dashboard API",
    description="API for Forecast Lab - Interactive time series forecasting dashboard",
    version="1.0.0"
)

# CORS middleware for frontend dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(config.router, prefix="/config", tags=["config"])
app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
app.include_router(runs.router, prefix="/runs", tags=["runs"])


@app.get("/")
async def root():
    return {"message": "Forecast Dashboard API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

