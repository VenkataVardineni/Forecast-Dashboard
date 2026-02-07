import React from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import { ForecastResponse } from '../types';
import './MetricsPanel.css';

interface MetricsPanelProps {
  data: ForecastResponse | null;
  loading: boolean;
}

const MetricsPanel: React.FC<MetricsPanelProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="metrics-panel loading">
        <LoadingSkeleton type="table" />
      </div>
    );
  }

  if (!data || !data.metrics) {
    return (
      <div className="metrics-panel empty">
        <div className="empty-message">No metrics available</div>
      </div>
    );
  }

  const { metrics } = data;
  const overallMae = metrics.overall_mae || 0;
  const overallRmse = metrics.overall_rmse || 0;
  const maePerStep = metrics.mae_per_step || [];
  const rmsePerStep = metrics.rmse_per_step || [];
  const coverageP10 = metrics.coverage_p10 || 0;
  const coverageP90 = metrics.coverage_p90 || 0;

  return (
    <div className="metrics-panel">
      <h2>Metrics</h2>

      <div className="metrics-summary">
        <div className="metric-card">
          <div className="metric-label">Overall MAE</div>
          <div className="metric-value">{overallMae.toFixed(3)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Overall RMSE</div>
          <div className="metric-value">{overallRmse.toFixed(3)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">P10 Coverage</div>
          <div className="metric-value">{(coverageP10 * 100).toFixed(1)}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">P90 Coverage</div>
          <div className="metric-value">{(coverageP90 * 100).toFixed(1)}%</div>
        </div>
      </div>

      {maePerStep.length > 0 && (
        <div className="metrics-detail">
          <h3>Per-Step Errors</h3>
          <div className="error-table">
            <div className="error-table-header">
              <span>Step</span>
              <span>MAE</span>
              <span>RMSE</span>
            </div>
            {maePerStep.map((mae, index) => (
              <div key={index} className="error-table-row">
                <span>{index + 1}</span>
                <span>{mae.toFixed(3)}</span>
                <span>
                  {rmsePerStep[index]?.toFixed(3) || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MetricsPanel;

