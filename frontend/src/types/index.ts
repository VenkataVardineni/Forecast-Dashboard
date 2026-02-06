export interface Config {
  models: string[];
  horizons: number[];
  quantiles: number[];
  folds_available: number[];
}

export interface Series {
  id: string;
  name: string;
  description: string;
}

export interface SeriesMetadata {
  dataset_name: string;
  series: Series[];
}

export interface ForecastDataPoint {
  timestamp: string;
  value?: number;
  p10?: number;
  p50?: number;
  p90?: number;
}

export interface ForecastQuery {
  model: string;
  horizon: number;
  fold_id?: number;
  overlay_mode?: boolean;
}

export interface ForecastResponse {
  history: ForecastDataPoint[];
  forecast_origin: string;
  forecast: ForecastDataPoint[];
  metrics: Metrics;
}

export interface Metrics {
  mae_per_step: number[];
  rmse_per_step: number[];
  coverage_p10: number;
  coverage_p90: number;
  overall_mae?: number;
  overall_rmse?: number;
}

export interface RunStatus {
  run_id: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  model?: string;
  horizon?: number;
  fold_id?: number;
  artifacts?: {
    metrics_path?: string;
    plot_path?: string;
  };
}

export interface SSEEvent {
  type: 'status' | 'log' | 'progress' | 'artifact' | 'complete' | 'error';
  message?: string;
  status?: string;
  progress?: number;
  timestamp?: string;
  metrics_path?: string;
  plot_path?: string;
}

