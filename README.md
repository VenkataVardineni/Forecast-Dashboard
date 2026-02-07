# Forecast Dashboard

**Forecast Lab** – An interactive web application for visualizing historical time series data with multi-horizon forecasts, uncertainty bands (P10/P50/P90), walk-forward fold playback, and live-run streaming.

## Overview

Forecast Dashboard is a data science tool that provides an intuitive interface for exploring time series forecasts. It serves as an "adapter layer" that consumes artifacts produced by the `timeseries-forecaster` training pipeline, making it easy to visualize and analyze forecast results without needing to write custom visualization code.

## Features

### 🎯 Core Functionalities

#### 1. **Interactive Forecast Visualization**
- **Historical Data Display**: View actual historical time series values
- **Forecast Lines**: Visualize P50 (median) forecast predictions
- **Uncertainty Bands**: Shaded P10-P90 confidence intervals showing forecast uncertainty
- **Interactive Tooltips**: Hover over data points to see exact values and timestamps
- **Responsive Charts**: Built with Recharts for smooth, interactive visualizations

#### 2. **Model Selection & Configuration**
- **Multiple Models**: Support for ARIMA and Seq2Seq-Attention quantile forecasting
- **Horizon Selection**: Choose forecast horizons (1, 7, 14, or 30 days)
- **Walk-Forward Validation**: Select different fold origins to see how forecasts perform at different time points
- **Overlay Mode**: Compare multiple forecasts from different origins on the same chart

#### 3. **Walk-Forward Fold Playback**
- **Fold Slider**: Interactive slider to switch between different walk-forward validation folds
- **Origin Points**: Each fold represents a different forecast origin point
- **Comparative Analysis**: Easily compare forecast performance across different time periods
- **Real Data Integration**: Loads actual fold data from your trained models

#### 4. **Metrics Dashboard**
- **Overall Metrics**: 
  - Mean Absolute Error (MAE)
  - Root Mean Squared Error (RMSE)
  - P10 Coverage (percentage of actuals above P10)
  - P90 Coverage (percentage of actuals below P90)
- **Per-Step Errors**: Detailed table showing MAE and RMSE for each horizon step
- **Real-Time Updates**: Metrics update automatically when you change model/horizon/fold

#### 5. **Live Run Streaming**
- **Server-Sent Events (SSE)**: Real-time log streaming from evaluation runs
- **Progress Tracking**: Visual progress bar showing run completion status
- **Live Console**: Watch training/evaluation logs stream in real-time
- **Status Indicators**: Color-coded status (queued/running/done/error)
- **Artifact Links**: Direct links to download metrics and plot artifacts

#### 6. **Advanced Features**
- **Client-Side Caching**: Intelligent caching of forecast queries (5-minute TTL)
- **Error Handling**: Robust error handling with retry logic and user-friendly error messages
- **Loading States**: Smooth loading skeletons and transitions
- **Responsive Design**: Works on desktop and tablet devices
- **Error Boundary**: Catches React errors gracefully with recovery options

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│              timeseries-forecaster                       │
│         (Training & Evaluation Pipeline)                  │
│                                                           │
│  Output: reports/<run_id>/                              │
│    ├── predictions.csv                                   │
│    ├── metrics_seq2seq.csv / metrics_arima.csv           │
│    ├── folds.json                                        │
│    └── config.json                                       │
└─────────────────────────────────────────────────────────┘
                        │
                        │ (reads artifacts)
                        ▼
┌─────────────────────────────────────────────────────────┐
│          Forecast Dashboard Backend (FastAPI)            │
│                                                           │
│  Services:                                               │
│    • ArtifactService: Loads CSV/JSON from reports/       │
│    • ForecastingService: Processes & formats data        │
│    • RunService: Manages evaluation runs & SSE           │
│                                                           │
│  Endpoints:                                              │
│    • GET  /config          - Available models/folds      │
│    • GET  /forecast/series - Dataset metadata            │
│    • POST /forecast/query  - Get forecast data           │
│    • POST /runs/start      - Start evaluation run       │
│    • GET  /runs/{id}/stream - SSE log streaming          │
└─────────────────────────────────────────────────────────┘
                        │
                        │ (HTTP/SSE)
                        ▼
┌─────────────────────────────────────────────────────────┐
│       Forecast Dashboard Frontend (React + TypeScript)   │
│                                                           │
│  Components:                                             │
│    • DashboardPage: Main container                        │
│    • ControlPanel: Model/horizon/fold selection          │
│    • ForecastChart: Interactive chart with uncertainty   │
│    • MetricsPanel: MAE/RMSE/coverage metrics              │
│    • RunConsole: Live SSE log streaming                   │
│                                                           │
│  Features:                                               │
│    • Query caching (5min TTL)                            │
│    • Error handling with retry                           │
│    • Loading skeletons                                   │
│    • Error boundaries                                    │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- FastAPI (Python web framework)
- Uvicorn (ASGI server)
- Pydantic (data validation)
- CSV/JSON parsing for artifact loading

**Frontend:**
- React 18 (UI framework)
- TypeScript (type safety)
- Recharts (charting library)
- Axios (HTTP client)
- Date-fns (date formatting)

**Infrastructure:**
- Docker & Docker Compose
- Nginx (frontend production server)
- Python 3.11
- Node.js 18+

## Data Flow

### 1. Training Phase (timeseries-forecaster)
The training pipeline produces artifacts in the `reports/` directory:
- `predictions.csv`: Contains forecast predictions with columns:
  - `fold`, `sample`, `horizon_step`, `timestamp`
  - `y_true` (actual values)
  - `y_pred_p10`, `y_pred_p50`, `y_pred_p90` (quantile forecasts)
- `metrics_*.csv`: Per-step MAE and RMSE metrics
- `folds.json`: Fold metadata including coverage and pinball scores
- `config.json`: Model configuration

### 2. Artifact Loading (Backend)
- Backend scans the `reports/` directory
- Identifies available models, horizons, and folds
- Loads CSV files on-demand when user queries
- Transforms data into API-friendly JSON format

### 3. Data Transformation
- Raw CSV data → Formatted with quantiles
- Missing quantiles → Estimated (for ARIMA models)
- Metrics calculation → Per-step errors + coverage percentages

### 4. Frontend Visualization
- API calls → Cached in memory (5min TTL)
- Chart rendering → Recharts with uncertainty bands
- Real-time updates → SSE for run logs

## Walk-Forward Validation

### Concept
Walk-forward validation splits the time series into multiple "folds", where each fold:
- Uses a different origin point (forecast start date)
- Trains on data up to that origin
- Evaluates on the next `horizon` days

### Example
```
Time Series: [Day 1, Day 2, ..., Day 100]

Fold 0: Train on [1-70],  Forecast [71-100]  (30-day horizon)
Fold 1: Train on [1-75],  Forecast [76-105]  (30-day horizon)
Fold 2: Train on [1-80],  Forecast [81-110]  (30-day horizon)
...
```

### Implementation
- **Backend**: Scans `folds.json` files to identify available folds
- **Frontend**: Fold slider allows selection of which fold to visualize
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

## API Endpoints

### Configuration
- **GET `/config`**: Returns available models, horizons, quantiles, and folds

### Forecast Data
- **GET `/forecast/series`**: Get dataset metadata and available series
- **POST `/forecast/query`**: Query forecast data
  ```json
  {
    "model": "seq2seq_attention_quantile",
    "horizon": 30,
    "fold_id": 0,
    "overlay_mode": false
  }
  ```
  Returns:
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
      "coverage_p90": 0.92,
      "overall_mae": 2.1,
      "overall_rmse": 2.6
    }
  }
  ```

### Run Management
- **POST `/runs/start`**: Start a new evaluation run
- **GET `/runs/{run_id}/stream`**: SSE endpoint for live run logs
- **GET `/runs/{run_id}/status`**: Get current run status

## Project Structure

```
.
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── routes/            # API route handlers
│   │   │   ├── config.py
│   │   │   ├── forecast.py
│   │   │   └── runs.py
│   │   └── services/          # Business logic
│   │       ├── artifacts.py   # Loads CSV/JSON from reports
│   │       ├── forecasting.py # Processes forecast data
│   │       └── runs.py        # Manages evaluation runs
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── ForecastChart.tsx
│   │   │   ├── MetricsPanel.tsx
│   │   │   ├── RunConsole.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ErrorDisplay.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx
│   │   ├── hooks/
│   │   │   └── useSSE.ts      # SSE client hook
│   │   ├── utils/
│   │   │   ├── api.ts         # API client
│   │   │   ├── cache.ts       # Query caching
│   │   │   └── errorHandler.ts
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript types
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── infra/
│   └── docker-compose.yml     # Docker Compose configuration
│
├── docs/
│   ├── architecture.md        # Detailed architecture documentation
│   └── screenshots/           # Screenshot placeholders
│
├── README.md                   # This file
├── SETUP.md                    # Setup instructions
└── .gitignore
```

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker & Docker Compose (optional)

### Development Setup
See [SETUP.md](SETUP.md) for detailed setup instructions.

### Quick Start with Docker
```bash
# Start all services
cd infra
docker-compose up

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

## Usage Guide

### Basic Workflow

1. **Select Model**: Choose between ARIMA or Seq2Seq-Attention
2. **Choose Horizon**: Select forecast horizon (1, 7, 14, or 30 days)
3. **Select Fold**: Use the slider to choose a walk-forward fold
4. **View Forecast**: Chart displays historical data + forecast with uncertainty bands
5. **Check Metrics**: Review MAE, RMSE, and coverage metrics
6. **Start Run**: Click "Start Run" to watch live evaluation logs

### Tips

- **Overlay Mode**: Enable to compare forecasts from different folds
- **Caching**: Forecast queries are cached for 5 minutes
- **Error Handling**: If you see errors, check that the backend can access your reports directory
- **Real Data**: Ensure your `timeseries-forecaster` has generated reports in the expected format

## Configuration

### Environment Variables

**Backend:**
- `FORECAST_REPORTS_DIR`: Path to reports directory (default: `./reports`)

**Frontend:**
- `REACT_APP_API_URL`: Backend API URL (default: `http://localhost:8000`)

### Reports Directory Structure

The backend expects reports in the following structure:
```
reports/
├── <model_name>_<timestamp>/
│   ├── predictions.csv
│   ├── metrics_<model>.csv
│   ├── folds.json
│   └── config.json
└── ...
```

## Performance

- **Caching**: Client-side caching reduces API calls (5-minute TTL)
- **Lazy Loading**: Forecast data loaded on-demand
- **Optimized Rendering**: React memoization and efficient re-renders
- **SSE Streaming**: Efficient real-time log streaming

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

- Built with FastAPI and React
- Uses Recharts for visualizations
- Designed for integration with timeseries-forecaster pipeline
