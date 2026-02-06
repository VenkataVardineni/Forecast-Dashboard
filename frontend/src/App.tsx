import React from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <DashboardPage />
      </div>
    </ErrorBoundary>
  );
}

export default App;

