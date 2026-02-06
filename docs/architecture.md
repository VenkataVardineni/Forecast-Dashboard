# Forecast Dashboard Architecture

## Overview

The Forecast Dashboard is a web application that provides an interactive interface for visualizing time series forecasts with uncertainty bands, walk-forward validation, and live run streaming. The system is designed as an "adapter layer" that consumes artifacts produced by the `timeseries-forecaster` training pipeline.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    timeseries-forecaster                        │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Training   │───▶│  Evaluation   │───▶│   Reports    │   │
│  │   Pipeline   │    │   Pipeline    │    │  Generation  │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│                                                               │
│                          Outputs:                             │
│  reports/                                                      │
│  ├── run_001/                                                  │
│  │   ├── report.json                                           │
│  │   ├── forecast_arima_h30_fold0.json                        │
│  │   ├── forecast_seq2seq_h30_fold0.json                      │
│  │   └── metrics.json                                          │
│  └── run_002/                                                  │
│      └── ...                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ (reads artifacts)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Forecast Dashboard Backend                     │
│                    (FastAPI Adapter Layer)                      │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Artifact    │    │ Forecasting   │    │   Run        │   │
│  │  Service     │    │   Service    │    │   Service    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                   │            │
│         └───────────────────┴───────────────────┘            │
│                              │                                │
│                    ┌─────────▼─────────┐                     │
│                    │   API Routes      │                     │
│                    │  - /config        │                     │
│                    │  - /forecast/query│                     │
│                    │  - /runs/start   │                     │
│                    │  - /runs/{id}/   │                     │
│                    │      stream (SSE) │                     │
│                    └─────────┬─────────┘                     │
└───────────────────────────────┼───────────────────────────────┘
                                │
                                │ (HTTP/SSE)
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Forecast Dashboard Frontend                    │
│                    (React + TypeScript)                         │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Dashboard   │    │   Forecast   │    │   Metrics    │   │
│  │    Page      │    │    Chart     │    │    Panel     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                   │                   │            │
│         └───────────────────┴───────────────────┘            │
│                              │                                │
│                    ┌─────────▼─────────┐                     │
│                    │  Control Panel   │                     │
│                    │  Run Console     │                     │
│                    │  (SSE Client)    │                     │
│                    └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### Backend Components

#### 1. Artifact Service (`app/services/artifacts.py`)
- **Purpose**: Loads and parses artifacts from `timeseries-forecaster` output directory
- **Responsibilities**:
  - Scan `reports/` directory for available folds and runs
  - Load forecast JSON files (model + horizon + fold combinations)
  - Parse report metadata
- **Configuration**: `FORECAST_REPORTS_DIR` environment variable (default: `./reports`)

#### 2. Forecasting Service (`app/services/forecasting.py`)
- **Purpose**: Processes forecast data and calculates metrics
- **Responsibilities**:
  - Format forecast data with quantiles (P10/P50/P90)
  - Calculate MAE/RMSE per step
  - Calculate coverage percentages for uncertainty bands
  - Handle both ARIMA (mean forecast) and Seq2Seq-Attention (quantile forecast) models
- **Output Format**:
  ```json
  {
    "history": [{"timestamp": "...", "value": 123.45}],
    "forecast_origin": "2024-01-01T00:00:00",
    "forecast": [
      {"timestamp": "...", "p10": 100, "p50": 120, "p90": 140}
    ],
    "metrics": {
      "mae_per_step": [2.1, 2.3, ...],
      "rmse_per_step": [2.6, 2.8, ...],
      "coverage_p10": 0.85,
      "coverage_p90": 0.92
    }
  }
  ```

#### 3. Run Service (`app/services/runs.py`)
- **Purpose**: Manages evaluation runs and streams logs via Server-Sent Events (SSE)
- **Responsibilities**:
  - Start background evaluation jobs
  - Stream progress and logs in real-time
  - Track run status (queued/running/done)
  - Emit artifact availability events
- **SSE Event Types**:
  - `status`: Run status updates
  - `log`: Log messages
  - `progress`: Progress percentage (0-100)
  - `artifact`: Artifact paths available
  - `complete`: Run completion

### Frontend Components

#### 1. Dashboard Page (`pages/DashboardPage.tsx`)
- Main container component
- Manages global state (selected model, horizon, fold)
- Coordinates data fetching and caching
- Layout: 2-column grid (chart + controls | metrics + console)

#### 2. Control Panel (`components/ControlPanel.tsx`)
- Model selection dropdown (ARIMA vs Seq2Seq-Attention)
- Horizon selection (1, 7, 14, 30 days)
- Walk-forward fold slider
- Overlay mode toggle
- "Run Evaluation" button

#### 3. Forecast Chart (`components/ForecastChart.tsx`)
- **Visualization**:
  - Historical actuals (black line)
  - Forecast P50 (blue line)
  - Uncertainty band (P10-P90 shaded area)
  - Forecast bounds (P10/P90 dashed lines)
- **Interactivity**:
  - Hover tooltips with timestamp and values
  - Responsive to model/horizon/fold changes
  - Overlay mode support (multiple forecasts)

#### 4. Metrics Panel (`components/MetricsPanel.tsx`)
- Overall metrics: MAE, RMSE, Coverage (P10/P90)
- Per-step error table (MAE and RMSE for each horizon step)
- Real-time updates when forecast changes

#### 5. Run Console (`components/RunConsole.tsx`)
- SSE client using `EventSource` API
- Live log streaming
- Progress bar
- Status indicator (queued/running/done)
- Artifact download links

## Artifact Flow

### 1. Training Phase (timeseries-forecaster)
```
timeseries-forecaster/
├── train.py                    # Training script
├── evaluate.py                 # Evaluation script
└── reports/                    # Output directory
    └── run_<timestamp>/
        ├── report.json         # Overall report
        ├── forecast_<model>_h<horizon>_fold<id>.json
        ├── metrics.json
        └── plots/
            └── forecast_plot.png
```

### 2. Artifact Loading (Forecast Dashboard Backend)
- Backend scans `reports/` directory (mounted as volume in Docker)
- Identifies available:
  - Models: `arima`, `seq2seq_attention_quantile`
  - Horizons: `1, 7, 14, 30`
  - Folds: `0, 1, 2, 3, 4` (from walk-forward validation)
- Loads forecast JSON files on-demand when user queries

### 3. Data Transformation
- Raw forecast data → Formatted with quantiles
- Missing quantiles → Estimated (for ARIMA)
- Metrics calculation → Per-step errors + coverage

### 4. Frontend Consumption
- API calls → Cached in memory (5min TTL)
- Chart rendering → Recharts with uncertainty bands
- Real-time updates → SSE for run logs

## Walk-Forward Validation & Fold Playback

### Concept
Walk-forward validation splits the time series into multiple "folds", where each fold:
- Uses a different origin point (forecast start date)
- Trains on data up to that origin
- Evaluates on the next `horizon` days

### Example
```
Time Series: [Day 1, Day 2, ..., Day 100]

Fold 0: Train on [1-70], Forecast [71-100] (30-day horizon)
Fold 1: Train on [1-75], Forecast [76-105] (30-day horizon)
Fold 2: Train on [1-80], Forecast [81-110] (30-day horizon)
...
```

### Implementation
- **Backend**: `ArtifactService.get_available_folds()` scans reports for fold IDs
- **Frontend**: Fold slider allows user to select which fold to visualize
- **Chart**: Shows forecast from selected fold origin point
- **Metrics**: Calculated per fold, allowing comparison across folds

## Overlay Mode

### Purpose
Compare forecasts from multiple fold origins on the same chart.

### How It Works
1. User enables "Overlay Mode" toggle
2. Frontend makes multiple API calls (one per fold)
3. Chart renders multiple forecast lines:
   - Each fold's P50 forecast (different colors)
   - All forecasts share the same historical actuals
4. Allows visual comparison of forecast accuracy across different origins

### Use Case
- Identify which fold origins produce better forecasts
- Understand forecast stability across time
- Compare model performance at different time periods

## Server-Sent Events (SSE) Streaming

### Architecture
```
Frontend                    Backend
   │                           │
   │  POST /runs/start         │
   ├──────────────────────────▶│
   │  {run_id: "abc123"}       │
   │◀──────────────────────────┤
   │                           │
   │  GET /runs/abc123/stream  │
   ├──────────────────────────▶│
   │  (SSE connection)         │
   │                           │
   │◀─── data: {"type":...} ───┤
   │◀─── data: {"type":...} ───┤
   │◀─── data: {"type":...} ───┤
```

### Event Format
```json
{
  "type": "log",
  "message": "Training model...",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Frontend Implementation
- Uses native `EventSource` API
- Auto-reconnects on connection loss
- Parses JSON events and updates UI
- Scrolls console to latest log

## Caching Strategy

### Client-Side Cache
- **Location**: `frontend/src/utils/cache.ts`
- **Key**: `{model}_{horizon}_{fold_id}_{overlay_mode}`
- **TTL**: 5 minutes
- **Max Size**: 50 entries
- **Purpose**: Reduce API calls for repeated queries

### Cache Invalidation
- Manual refresh via "Run Evaluation" button
- Automatic expiration after TTL
- Clear on model/horizon/fold change

## Error Handling

### Backend
- HTTP status codes: 400 (bad request), 404 (not found), 500 (server error)
- Error messages in response body: `{"detail": "Error message"}`

### Frontend
- **Error Boundary**: Catches React component errors
- **API Error Handler**: Categorizes errors (network, server, client)
- **Retry Logic**: Automatic retry for retryable errors (exponential backoff)
- **User Feedback**: ErrorDisplay component with retry button

## Deployment

### Docker Compose
- **Backend**: FastAPI on port 8000
- **Frontend**: Nginx serving React build on port 3000
- **Volumes**: 
  - `reports/` → `/artifacts/reports` (read-only)
  - `backend-logs/` → `/app/logs`

### Environment Variables
- `FORECAST_REPORTS_DIR`: Path to reports directory (backend)
- `REACT_APP_API_URL`: Backend API URL (frontend build-time)

## Future Enhancements

1. **Real-time Training Integration**: Connect SSE to actual training pipeline
2. **Multiple Series Support**: Allow selection of different time series
3. **Export Functionality**: Download forecasts as CSV/JSON
4. **Comparison Mode**: Side-by-side model comparison
5. **Advanced Metrics**: Additional statistical measures (MAPE, MASE, etc.)
6. **User Authentication**: Multi-user support with saved preferences

