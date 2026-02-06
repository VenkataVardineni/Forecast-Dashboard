import React from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorDisplay from './ErrorDisplay';
import { ForecastResponse } from '../types';
import { format } from 'date-fns';
import './ForecastChart.css';

interface ForecastChartProps {
  data: ForecastResponse | null;
  loading: boolean;
  error: string | null;
  overlayMode: boolean;
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  loading,
  error,
  overlayMode,
}) => {
  if (loading) {
    return (
      <div className="forecast-chart loading">
        <LoadingSkeleton type="chart" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="forecast-chart error">
        <ErrorDisplay error={error} retryable={true} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!data || !data.history || !data.forecast) {
    return (
      <div className="forecast-chart empty">
        <div className="empty-message">
          Select a model and horizon to view forecasts
        </div>
      </div>
    );
  }

  // Combine history and forecast for display
  const chartData = [
    ...data.history.map((point) => ({
      timestamp: point.timestamp,
      actual: point.value,
      type: 'history',
    })),
    ...data.forecast.map((point) => ({
      timestamp: point.timestamp,
      p10: point.p10,
      p50: point.p50,
      p90: point.p90,
      type: 'forecast',
    })),
  ];

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'MMM dd, yyyy');
    } catch {
      return timestamp;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{formatDate(data.timestamp)}</p>
          {data.actual !== undefined && (
            <p className="tooltip-value">Actual: {data.actual.toFixed(2)}</p>
          )}
          {data.p50 !== undefined && (
            <>
              <p className="tooltip-value">P50: {data.p50.toFixed(2)}</p>
              <p className="tooltip-value">P10: {data.p10?.toFixed(2)}</p>
              <p className="tooltip-value">P90: {data.p90?.toFixed(2)}</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="forecast-chart">
      <h2>Forecast Visualization</h2>
      <ResponsiveContainer width="100%" height={500}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUncertainty" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Uncertainty band (P10 to P90) */}
          <Area
            type="monotone"
            dataKey="p90"
            stroke="none"
            fill="url(#colorUncertainty)"
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="p10"
            stroke="none"
            fill="white"
            connectNulls
          />
          
          {/* Historical actuals */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#333"
            strokeWidth={2}
            dot={false}
            name="Historical"
          />
          
          {/* Forecast P50 */}
          <Line
            type="monotone"
            dataKey="p50"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            name="Forecast (P50)"
          />
          
          {/* Forecast bounds */}
          <Line
            type="monotone"
            dataKey="p10"
            stroke="#8884d8"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="P10"
          />
          <Line
            type="monotone"
            dataKey="p90"
            stroke="#8884d8"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="P90"
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {data.forecast_origin && (
        <div className="forecast-origin">
          Forecast origin: {formatDate(data.forecast_origin)}
        </div>
      )}
    </div>
  );
};

export default ForecastChart;

