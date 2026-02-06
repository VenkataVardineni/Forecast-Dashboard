import React, { useState, useEffect, useRef } from 'react';
import { useSSE } from '../hooks/useSSE';
import { runsApi } from '../utils/api';
import './RunConsole.css';

interface RunConsoleProps {
  model?: string;
  horizon?: number;
  foldId?: number;
}

const RunConsole: React.FC<RunConsoleProps> = () => {
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<string>('idle');
  const [progress, setProgress] = useState<number>(0);
  const { events, isConnected, clearEvents } = useSSE(runId);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new events arrive
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [events]);

  useEffect(() => {
    // Update status and progress from SSE events
    events.forEach((event) => {
      if (event.type === 'status') {
        setRunStatus(event.status || 'idle');
      }
      if (event.type === 'progress') {
        setProgress(event.progress || 0);
      }
      if (event.type === 'complete') {
        setRunStatus('done');
        setProgress(100);
      }
    });
  }, [events]);

  const handleStartRun = async () => {
    try {
      clearEvents();
      setRunStatus('queued');
      setProgress(0);
      
      const response = await runsApi.startRun('seq2seq_attention_quantile', 30);
      setRunId(response.run_id);
    } catch (error) {
      console.error('Error starting run:', error);
      setRunStatus('error');
    }
  };

  const getStatusColor = () => {
    switch (runStatus) {
      case 'queued':
        return '#ffa726';
      case 'running':
        return '#42a5f5';
      case 'done':
        return '#66bb6a';
      case 'error':
        return '#ef5350';
      default:
        return '#9e9e9e';
    }
  };

  return (
    <div className="run-console">
      <div className="run-console-header">
        <h2>Run Console</h2>
        <div className="run-controls">
          <button
            className="start-run-button"
            onClick={handleStartRun}
            disabled={runStatus === 'running' || runStatus === 'queued'}
          >
            Start Run
          </button>
        </div>
      </div>

      <div className="run-status">
        <div className="status-indicator">
          <span
            className="status-dot"
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="status-text">
            {runStatus.charAt(0).toUpperCase() + runStatus.slice(1)}
          </span>
        </div>
        {(runStatus === 'running' || runStatus === 'queued') && (
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="run-logs" ref={consoleRef}>
        {events.length === 0 && (
          <div className="log-empty">No logs yet. Start a run to see live logs.</div>
        )}
        {events.map((event, index) => {
          if (event.type === 'log') {
            return (
              <div key={index} className="log-entry">
                <span className="log-timestamp">
                  {event.timestamp
                    ? new Date(event.timestamp).toLocaleTimeString()
                    : ''}
                </span>
                <span className="log-message">{event.message}</span>
              </div>
            );
          }
          if (event.type === 'artifact') {
            return (
              <div key={index} className="log-entry log-artifact">
                <span className="log-message">
                  Artifacts available:
                  {event.metrics_path && (
                    <a href={event.metrics_path} target="_blank" rel="noopener noreferrer">
                      Metrics
                    </a>
                  )}
                  {event.plot_path && (
                    <a href={event.plot_path} target="_blank" rel="noopener noreferrer">
                      Plot
                    </a>
                  )}
                </span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default RunConsole;

