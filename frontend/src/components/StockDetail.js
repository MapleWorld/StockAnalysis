import React from 'react';

function StockDetail({ stockData }) {
  if (!stockData) {
    return null;
  }

  const formatRatio = (ratio) => {
    if (ratio === 'N/A' || ratio === undefined || ratio === null) return 'N/A';
    return ratio.toFixed(2);
  };

  const formatDividend = (value) => {
    if (value === 'N/A' || value === undefined || value === null) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value) => {
    if (value === 'N/A' || value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume === undefined || volume === null) return 'N/A';
    return volume.toLocaleString();
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap === undefined || marketCap === null) return 'N/A';
    return `$${(marketCap / 1000000000).toFixed(2)}B`;
  };

  return (
    <div className="stock-detail">
      <h2>{stockData.companyName || 'N/A'} ({stockData.symbol || 'N/A'})</h2>
      <div className="stock-info">
        <div className="info-item">
          <span className="label">Current Price:</span>
          <span className="value">{formatPrice(stockData.price)}</span>
        </div>
        <div className="info-item">
          <span className="label">Change:</span>
          <span className={`value ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
            {formatPercentage(stockData.change)}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Volume:</span>
          <span className="value">{formatVolume(stockData.volume)}</span>
        </div>
        <div className="info-item">
          <span className="label">Market Cap:</span>
          <span className="value">{formatMarketCap(stockData.marketCap)}</span>
        </div>
        <div className="info-item">
          <span className="label">P/E Ratio:</span>
          <span className="value">{formatRatio(stockData.peRatio)}</span>
        </div>
        <div className="info-item">
          <span className="label">Forward P/E:</span>
          <span className="value">{formatRatio(stockData.forwardPE)}</span>
        </div>
        <div className="info-item">
          <span className="label">Dividend Yield:</span>
          <span className="value">{formatPercentage(stockData.dividendYield)}</span>
        </div>
        <div className="info-item">
          <span className="label">Dividend Per Share:</span>
          <span className="value">{formatDividend(stockData.dividendPerShare)}</span>
        </div>
        <div className="info-item">
          <span className="label">Payout Ratio:</span>
          <span className="value">{formatPercentage(stockData.payoutRatio)}</span>
        </div>
        <div className="info-item">
          <span className="label">Sector:</span>
          <span className="value">{stockData.sector || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

export default StockDetail; 