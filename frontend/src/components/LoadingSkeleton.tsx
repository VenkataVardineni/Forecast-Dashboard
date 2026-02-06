import React from 'react';
import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  type?: 'chart' | 'panel' | 'table';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type = 'panel' }) => {
  if (type === 'chart') {
    return (
      <div className="skeleton skeleton-chart">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-chart-area">
          <div className="skeleton-line skeleton-chart-line" />
          <div className="skeleton-line skeleton-chart-line" />
          <div className="skeleton-line skeleton-chart-line" />
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="skeleton skeleton-table">
        <div className="skeleton-line skeleton-title" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-table-row">
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton skeleton-panel">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-short" />
    </div>
  );
};

export default LoadingSkeleton;

