# Forecast Dashboard

**Forecast Lab UI** – An interactive web application for visualizing historical time series data with multi-horizon forecasts, uncertainty bands (P10/P50/P90), walk-forward fold playback, and live-run streaming.

## Product Description

Forecast Lab is a data science tool that enables teams to:
- Select datasets and time series
- Choose forecasting models (ARIMA vs Seq2Seq-Attention)
- Configure forecast horizons
- Explore forecasts with confidence bands (P10/P50/P90)
- Inspect per-step errors and metrics
- Replay walk-forward validation folds
- Watch training/evaluation runs stream logs in real-time

## Features

- **Interactive Forecast Visualization**: Historical data + forecast P50 line + shaded P10–P90 uncertainty bands
- **Model Selection**: ARIMA and Seq2Seq-Attention quantile forecasting
- **Walk-Forward Validation**: Replay different fold origins with interactive slider
- **Live Run Streaming**: Real-time logs via Server-Sent Events (SSE)
- **Metrics Dashboard**: MAE/RMSE per horizon step + coverage percentage
- **Overlay Mode**: Compare multiple forecasts from different origins

## Screenshots

Screenshots will be available in `docs/screenshots/` after deployment.

## Architecture

- **Backend**: FastAPI adapter layer that loads artifacts from `timeseries-forecaster`
- **Frontend**: React + TypeScript with interactive charts
- **Infrastructure**: Docker Compose for local development

## Local Development

### Prerequisites

- Docker and Docker Compose
- Python 3.8+ (for local backend development)
- Node.js 16+ (for local frontend development)

### Quick Start with Docker

```bash
# Start all services
docker-compose up

# Backend will be available at http://localhost:8000
# Frontend will be available at http://localhost:3000
```

### Manual Setup

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## Project Structure

```
.
├── backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   └── services/
│   └── requirements.txt
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── hooks/
│   └── package.json
├── infra/            # Docker and infrastructure configs
│   └── docker-compose.yml
├── docs/             # Documentation
│   └── architecture.md
└── README.md
```

## API Endpoints

- `GET /config` - Get available models, horizons, quantiles, and folds
- `GET /series` - Get dataset metadata and available series
- `POST /forecast/query` - Query forecast data with model/horizon/fold
- `POST /runs/start` - Start a new evaluation run
- `GET /runs/{run_id}/stream` - SSE stream for live run logs

## License

MIT
