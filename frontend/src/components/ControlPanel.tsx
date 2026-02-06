import React from 'react';
import { Config } from '../types';
import './ControlPanel.css';

interface ControlPanelProps {
  config: Config | null;
  selectedModel: string;
  selectedHorizon: number;
  selectedFold: number;
  overlayMode: boolean;
  onModelChange: (model: string) => void;
  onHorizonChange: (horizon: number) => void;
  onFoldChange: (fold: number) => void;
  onOverlayToggle: (enabled: boolean) => void;
  onRunEvaluation: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  selectedModel,
  selectedHorizon,
  selectedFold,
  overlayMode,
  onModelChange,
  onHorizonChange,
  onFoldChange,
  onOverlayToggle,
  onRunEvaluation,
}) => {
  return (
    <div className="control-panel">
      <h2>Controls</h2>

      <div className="control-group">
        <label htmlFor="model-select">Model</label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={!config}
        >
          {!config && <option>Loading...</option>}
          {config?.models.map((model) => (
            <option key={model} value={model}>
              {model === 'arima' ? 'ARIMA' : 'Seq2Seq-Attention'}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="horizon-select">Horizon</label>
        <select
          id="horizon-select"
          value={selectedHorizon}
          onChange={(e) => onHorizonChange(Number(e.target.value))}
          disabled={!config}
        >
          {config?.horizons.map((horizon) => (
            <option key={horizon} value={horizon}>
              {horizon} day{horizon !== 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="control-group">
        <label htmlFor="fold-slider">
          Walk-Forward Fold: {selectedFold}
        </label>
        <input
          id="fold-slider"
          type="range"
          min={0}
          max={config?.folds_available.length ? config.folds_available.length - 1 : 4}
          value={selectedFold}
          onChange={(e) => onFoldChange(Number(e.target.value))}
          disabled={!config}
          className="slider"
        />
        <div className="fold-info">
          Available folds: {config?.folds_available.join(', ') || 'Loading...'}
        </div>
      </div>

      <div className="control-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={overlayMode}
            onChange={(e) => onOverlayToggle(e.target.checked)}
          />
          <span>Overlay Mode</span>
        </label>
        <small>Show multiple forecasts from different origins</small>
      </div>

      <button
        className="run-button"
        onClick={onRunEvaluation}
        disabled={!config || !selectedModel}
      >
        Run Evaluation
      </button>
    </div>
  );
};

export default ControlPanel;

