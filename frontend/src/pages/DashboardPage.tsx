import React, { useState, useEffect } from 'react';
import ControlPanel from '../components/ControlPanel';
import ForecastChart from '../components/ForecastChart';
import MetricsPanel from '../components/MetricsPanel';
import RunConsole from '../components/RunConsole';
import { configApi, forecastApi } from '../utils/api';
import { Config, ForecastResponse } from '../types';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(30);
  const [selectedFold, setSelectedFold] = useState<number>(0);
  const [overlayMode, setOverlayMode] = useState<boolean>(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configData = await configApi.getConfig();
      setConfig(configData);
      if (configData.models.length > 0) {
        setSelectedModel(configData.models[0]);
      }
    } catch (err) {
      setError('Failed to load configuration');
      console.error(err);
    }
  };

  const loadForecast = async () => {
    if (!selectedModel) return;

    setLoading(true);
    setError(null);

    try {
      const data = await forecastApi.queryForecast({
        model: selectedModel,
        horizon: selectedHorizon,
        fold_id: selectedFold,
        overlay_mode: overlayMode,
      });
      setForecastData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load forecast data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedModel && selectedHorizon) {
      loadForecast();
    }
  }, [selectedModel, selectedHorizon, selectedFold, overlayMode]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Forecast Lab</h1>
        <p className="subtitle">Interactive Time Series Forecasting Dashboard</p>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-left">
          <ControlPanel
            config={config}
            selectedModel={selectedModel}
            selectedHorizon={selectedHorizon}
            selectedFold={selectedFold}
            overlayMode={overlayMode}
            onModelChange={setSelectedModel}
            onHorizonChange={setSelectedHorizon}
            onFoldChange={setSelectedFold}
            onOverlayToggle={setOverlayMode}
            onRunEvaluation={() => loadForecast()}
          />

          <ForecastChart
            data={forecastData}
            loading={loading}
            error={error}
            overlayMode={overlayMode}
          />
        </div>

        <div className="dashboard-right">
          <MetricsPanel data={forecastData} loading={loading} />

          <RunConsole />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

