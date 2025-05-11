import React, { useState } from 'react';
import './App.css';
import StockSearch from './components/StockSearch';
import StockDetail from './components/StockDetail';
import StockChart from './components/StockChart';
import StockMetrics from './components/StockMetrics';
import { fetchAllStockData } from './services/stockApi';

function App() {
  const [symbol, setSymbol] = useState('');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInterval, setSelectedInterval] = useState('1D');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!symbol) return;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllStockData(symbol);
      setStockData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Stock Analysis Dashboard</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="search-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </form>
      </header>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {stockData && (
        <div className="dashboard">
          <div className="time-interval-controls">
            <button 
              className={selectedInterval === '1D' ? 'active' : ''} 
              onClick={() => setSelectedInterval('1D')}
            >
              1D
            </button>
            <button 
              className={selectedInterval === '1W' ? 'active' : ''} 
              onClick={() => setSelectedInterval('1W')}
            >
              1W
            </button>
            <button 
              className={selectedInterval === '1M' ? 'active' : ''} 
              onClick={() => setSelectedInterval('1M')}
            >
              1M
            </button>
            <button 
              className={selectedInterval === '3M' ? 'active' : ''} 
              onClick={() => setSelectedInterval('3M')}
            >
              3M
            </button>
            <button 
              className={selectedInterval === 'YTD' ? 'active' : ''} 
              onClick={() => setSelectedInterval('YTD')}
            >
              YTD
            </button>
            <button 
              className={selectedInterval === '1Y' ? 'active' : ''} 
              onClick={() => setSelectedInterval('1Y')}
            >
              1Y
            </button>
            <button 
              className={selectedInterval === '5Y' ? 'active' : ''} 
              onClick={() => setSelectedInterval('5Y')}
            >
              5Y
            </button>
          </div>

          <div className="dashboard-grid">
            <div className="chart-section">
              <StockChart 
                historicalData={stockData.historicalData}
                intradayData={stockData.intradayData}
                selectedInterval={selectedInterval}
              />
            </div>
            <div className="metrics-section">
              <StockMetrics 
                overview={stockData.overview}
                earnings={stockData.earnings}
                peData={stockData.peData}
                symbol={symbol}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
