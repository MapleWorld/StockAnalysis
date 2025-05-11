import React, { useState } from 'react';
import './StockSearch.css';

function StockSearch({ onSearch }) {
  const [symbol, setSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) return;

    setIsLoading(true);
    try {
      await onSearch(symbol.trim().toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="stock-search">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter stock symbol (e.g., AAPL)"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className="search-button"
          disabled={isLoading || !symbol.trim()}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
}

export default StockSearch; 