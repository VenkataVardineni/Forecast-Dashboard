import React from 'react';
import './ErrorDisplay.css';

interface ErrorDisplayProps {
  error: string;
  retryable?: boolean;
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, retryable, onRetry }) => {
  return (
    <div className="error-display">
      <div className="error-icon">⚠️</div>
      <div className="error-message">{error}</div>
      {retryable && onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
      {!retryable && (
        <div className="error-help">
          If this problem persists, please check that the backend is running and artifacts are available.
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;

