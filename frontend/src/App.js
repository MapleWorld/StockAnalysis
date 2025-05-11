import React, { useState } from 'react';
import './App.css';
import StockSearch from './components/StockSearch';
import StockDetail from './components/StockDetail';
import StockChart from './components/StockChart';
import StockMetrics from './components/StockMetrics';
import { fetchAllStockData } from './services/stockApi';

function App() {
  const [stockData, setStockData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (symbol) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllStockData(symbol);
      setStockData(data);
    } catch (error) {
      setError(error.message);
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Analysis Dashboard</h1>
      </header>
      <main>
        <StockSearch onSearch={handleSearch} loading={loading} />
        {error && <div className="error-message">{error}</div>}
        {stockData && (
          <>
            <StockDetail data={stockData} />
            <StockChart 
              historicalData={stockData.historicalData}
              symbol={stockData.symbol}
            />
            <StockMetrics 
              earnings={stockData.earnings}
              peData={stockData.peData}
              symbol={stockData.symbol}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
