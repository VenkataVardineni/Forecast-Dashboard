import axios from 'axios';
import { Config, SeriesMetadata, ForecastQuery, ForecastResponse, RunStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const configApi = {
  getConfig: async (): Promise<Config> => {
    const response = await api.get<Config>('/config');
    return response.data;
  },
};

export const forecastApi = {
  getSeries: async (): Promise<SeriesMetadata> => {
    const response = await api.get<SeriesMetadata>('/forecast/series');
    return response.data;
  },

  queryForecast: async (query: ForecastQuery): Promise<ForecastResponse> => {
    const response = await api.post<ForecastResponse>('/forecast/query', query);
    return response.data;
  },
};

export const runsApi = {
  startRun: async (model: string, horizon: number, foldId?: number): Promise<{ run_id: string; status: string }> => {
    const response = await api.post<{ run_id: string; status: string }>('/runs/start', {
      model,
      horizon,
      fold_id: foldId,
    });
    return response.data;
  },

  getRunStatus: async (runId: string): Promise<RunStatus> => {
    const response = await api.get<RunStatus>(`/runs/${runId}/status`);
    return response.data;
  },
};

export default api;

