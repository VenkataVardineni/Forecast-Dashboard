# Forecast Dashboard - Setup Guide

This guide will walk you through setting up the Forecast Dashboard application from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Development Setup](#development-setup)
4. [Docker Setup](#docker-setup)
5. [Configuration](#configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Python 3.8+**: [Download Python](https://www.python.org/downloads/)
- **Node.js 16+**: [Download Node.js](https://nodejs.org/)
- **npm or yarn**: Comes with Node.js
- **Git**: [Download Git](https://git-scm.com/downloads)

### Optional (for Docker setup)

- **Docker**: [Download Docker](https://www.docker.com/get-started)
- **Docker Compose**: Usually included with Docker Desktop

### Data Requirements

- **timeseries-forecaster reports**: Your trained model artifacts should be in a `reports/` directory
  - The reports should contain:
    - `predictions.csv` (with columns: fold, timestamp, y_true, y_pred_p10, y_pred_p50, y_pred_p90)
    - `metrics_*.csv` (with columns: horizon_step, mae, rmse, fold)
    - `folds.json` (with fold metadata)
    - `config.json` (model configuration)

## Installation Methods

Choose one of the following setup methods:

1. [Development Setup](#development-setup) - For local development (recommended)
2. [Docker Setup](#docker-setup) - For containerized deployment

## Development Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/VenkataVardineni/Forecast-Dashboard.git
cd Forecast-Dashboard
```

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory

```bash
cd backend
```

#### 2.2 Create Virtual Environment (Recommended)

```bash
# On macOS/Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

#### 2.3 Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI
- Uvicorn
- Pydantic
- Other required packages

#### 2.4 Verify Backend Installation

```bash
python -c "import fastapi; print('FastAPI installed successfully')"
```

### Step 3: Frontend Setup

#### 3.1 Navigate to Frontend Directory

```bash
cd ../frontend
```

#### 3.2 Install Dependencies

```bash
npm install
```

This will install:
- React 18
- TypeScript
- Recharts
- Axios
- Other required packages

#### 3.3 Verify Frontend Installation

```bash
npm list react react-dom
```

### Step 4: Configuration

#### 4.1 Backend Configuration

Set the environment variable for the reports directory:

```bash
# On macOS/Linux
export FORECAST_REPORTS_DIR="/path/to/your/timeseries-forecaster/reports"

# On Windows (Command Prompt)
set FORECAST_REPORTS_DIR=C:\path\to\your\timeseries-forecaster\reports

# On Windows (PowerShell)
$env:FORECAST_REPORTS_DIR="C:\path\to\your\timeseries-forecaster\reports"
```

**Example:**
```bash
export FORECAST_REPORTS_DIR="/Users/venkatarevanth/Time Series Forecaster/reports"
```

#### 4.2 Frontend Configuration

The frontend is pre-configured to connect to `http://localhost:8001` by default.

To change the API URL, create a `.env` file in the `frontend/` directory:

```bash
cd frontend
echo "REACT_APP_API_URL=http://localhost:8001" > .env
```

### Step 5: Start the Application

#### 5.1 Start Backend Server

Open a terminal and run:

```bash
cd backend

# Set reports directory (if not already set)
export FORECAST_REPORTS_DIR="/path/to/your/reports"

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

#### 5.2 Start Frontend Development Server

Open a **new terminal** and run:

```bash
cd frontend
npm start
```

You should see:
```
Compiled successfully!

You can now view forecast-dashboard-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

The browser should automatically open to `http://localhost:3000`. If not, manually navigate to that URL.

### Step 6: Verify Installation

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8001/health
   ```
   Should return: `{"status":"healthy"}`

2. **Backend Config:**
   ```bash
   curl http://localhost:8001/config
   ```
   Should return JSON with models, horizons, and folds.

3. **Frontend:**
   - Open `http://localhost:3000` in your browser
   - You should see the "Forecast Lab" dashboard
   - Select a model and horizon to load forecast data

## Docker Setup

### Step 1: Prerequisites

Ensure Docker and Docker Compose are installed and running.

### Step 2: Configure Reports Directory

Edit `infra/docker-compose.yml` and update the volume mount:

```yaml
volumes:
  - /path/to/your/reports:/artifacts/reports:ro
```

**Example:**
```yaml
volumes:
  - /Users/venkatarevanth/Time Series Forecaster/reports:/artifacts/reports:ro
```

### Step 3: Build and Start Services

```bash
cd infra
docker-compose up --build
```

This will:
- Build the backend Docker image
- Build the frontend Docker image
- Start both services

### Step 4: Access the Application

- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000

### Step 5: Stop Services

```bash
docker-compose down
```

## Configuration

### Backend Environment Variables

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `FORECAST_REPORTS_DIR` | Path to reports directory | `./reports` | Yes (for real data) |

### Frontend Environment Variables

| Variable | Description | Default | Required |
|----------|------------|---------|----------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:8001` | No |

### Reports Directory Structure

The backend expects the following structure:

```
reports/
├── <model_name>_<timestamp>/
│   ├── predictions.csv          # Required: Forecast predictions
│   ├── metrics_<model>.csv       # Required: Per-step metrics
│   ├── folds.json                # Required: Fold metadata
│   └── config.json               # Optional: Model config
└── ...
```

**predictions.csv format:**
```csv
fold,sample,horizon_step,timestamp,y_true,y_pred_p10,y_pred_p50,y_pred_p90
0,0,1,2021-06-18T00:00:00,0.0667,-1.546,-0.816,0.086
...
```

**metrics_*.csv format:**
```csv
horizon_step,mae,rmse,fold
1,0.788,0.929,0
2,0.792,0.944,0
...
```

**folds.json format:**
```json
{
  "folds": [
    {
      "fold": 0,
      "train_idx": [0, 371],
      "test_idx": [460, 490],
      "coverage": 0.616,
      "pinball_p10": 0.149,
      "pinball_p50": 0.404,
      "pinball_p90": 0.187
    }
  ]
}
```

## Verification

### Backend Verification

1. **Health Endpoint:**
   ```bash
   curl http://localhost:8001/health
   ```
   Expected: `{"status":"healthy"}`

2. **Config Endpoint:**
   ```bash
   curl http://localhost:8001/config
   ```
   Expected: JSON with models, horizons, quantiles, and folds

3. **Forecast Query:**
   ```bash
   curl -X POST http://localhost:8001/forecast/query \
     -H "Content-Type: application/json" \
     -d '{"model":"seq2seq_attention_quantile","horizon":30,"fold_id":0}'
   ```
   Expected: JSON with history, forecast, and metrics

### Frontend Verification

1. Open `http://localhost:3000` in your browser
2. Check browser console (F12) for errors
3. Select a model from the dropdown
4. Select a horizon (e.g., 30 days)
5. Adjust the fold slider
6. Verify the chart displays forecast data
7. Check that metrics panel shows values

## Troubleshooting

### Backend Issues

#### Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using port 8001
lsof -ti:8001

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --reload --port 8002
```

#### Reports Directory Not Found

**Error:** No data showing in API responses

**Solution:**
1. Verify the path is correct:
   ```bash
   echo $FORECAST_REPORTS_DIR
   ls -la "$FORECAST_REPORTS_DIR"
   ```

2. Check file permissions:
   ```bash
   ls -la "$FORECAST_REPORTS_DIR"/*/predictions.csv
   ```

3. Ensure CSV files exist and are readable

#### Import Errors

**Error:** `ModuleNotFoundError`

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Issues

#### Port Already in Use

**Error:** `Something is already running on port 3000`

**Solution:**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

#### Module Not Found

**Error:** `Cannot find module`

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### API Connection Errors

**Error:** `Network Error` or `CORS Error`

**Solution:**
1. Verify backend is running:
   ```bash
   curl http://localhost:8001/health
   ```

2. Check API URL in frontend:
   - Verify `.env` file has correct `REACT_APP_API_URL`
   - Restart frontend after changing `.env`

3. Check CORS settings in `backend/app/main.py`

#### Blank Page / No Data

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API calls in Network tab
4. Ensure backend is running and accessible
5. Check that reports directory contains valid data

### Docker Issues

#### Build Fails

**Error:** `docker build` fails

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose build --no-cache
```

#### Container Won't Start

**Error:** Container exits immediately

**Solution:**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check volume mounts
docker-compose config
```

### Data Issues

#### No Forecasts Showing

**Possible Causes:**
1. Reports directory path incorrect
2. CSV files missing or empty
3. Model name mismatch (check folder names)
4. Fold ID not found in data

**Solution:**
1. Verify reports directory structure
2. Check CSV file format matches expected schema
3. Ensure model names in folder match API expectations:
   - ARIMA: folder should contain "arima"
   - Seq2Seq: folder should contain "seq2seq"

#### Metrics Not Loading

**Possible Causes:**
1. `metrics_*.csv` file missing
2. Incorrect column names
3. Fold ID mismatch

**Solution:**
1. Verify metrics CSV exists
2. Check column names: `horizon_step,mae,rmse,fold`
3. Ensure fold IDs match between predictions and metrics

## Next Steps

After successful setup:

1. **Explore the Dashboard:**
   - Try different models and horizons
   - Use the fold slider to see different validation periods
   - Enable overlay mode to compare forecasts

2. **Review Metrics:**
   - Check MAE and RMSE per step
   - Review coverage percentages
   - Compare performance across folds

3. **Start Evaluation Runs:**
   - Click "Start Run" in the Run Console
   - Watch live logs stream via SSE
   - Download artifacts when complete

4. **Customize:**
   - Modify chart colors in `ForecastChart.tsx`
   - Adjust caching TTL in `cache.ts`
   - Add new metrics in `MetricsPanel.tsx`

## Additional Resources

- [Architecture Documentation](docs/architecture.md)
- [API Documentation](http://localhost:8001/docs) (Swagger UI when backend is running)
- [React Documentation](https://react.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## Support

If you encounter issues not covered in this guide:

1. Check the browser console for errors
2. Check backend logs for errors
3. Verify all prerequisites are installed
4. Ensure reports directory structure is correct
5. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - System information (OS, Python version, Node version)

## Quick Reference

### Start Development Servers

**Terminal 1 (Backend):**
```bash
cd backend
export FORECAST_REPORTS_DIR="/path/to/reports"
uvicorn app.main:app --reload --port 8001
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

### Stop Servers

- Backend: `Ctrl+C` in backend terminal
- Frontend: `Ctrl+C` in frontend terminal

### Check Status

```bash
# Backend
curl http://localhost:8001/health

# Frontend
curl http://localhost:3000
```

### Common Commands

```bash
# Install backend dependencies
cd backend && pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install

# Run backend tests (if available)
cd backend && pytest

# Build frontend for production
cd frontend && npm run build

# Docker commands
cd infra && docker-compose up
cd infra && docker-compose down
cd infra && docker-compose logs
```

