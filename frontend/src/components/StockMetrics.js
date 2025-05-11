import React from 'react';
import './StockMetrics.css';

const StockMetrics = ({ earnings, peData, symbol }) => {
  const formatNumber = (value) => {
    if (value === 'N/A') return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === 'N/A') return 'N/A';
    return `${formatNumber(value)}%`;
  };

  return (
    <div className="stock-metrics">
      <div className="metrics-section">
        <h2>Valuation Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">P/E Ratio</span>
            <span className="metric-value">{formatNumber(peData.currentPE)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Forward P/E</span>
            <span className="metric-value">{formatNumber(peData.forwardPE)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">PEG Ratio</span>
            <span className="metric-value">{formatNumber(peData.pegRatio)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Price/Book</span>
            <span className="metric-value">{formatNumber(peData.priceToBookRatio)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Price/Sales</span>
            <span className="metric-value">{formatNumber(peData.priceToSalesRatio)}</span>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h2>Quarterly Earnings</h2>
        <div className="earnings-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reported EPS</th>
                <th>Estimated EPS</th>
                <th>Surprise</th>
                <th>Surprise %</th>
              </tr>
            </thead>
            <tbody>
              {earnings.quarterly.map((earning, index) => (
                <tr key={index}>
                  <td>{new Date(earning.date).toLocaleDateString()}</td>
                  <td>{formatNumber(earning.reportedEPS)}</td>
                  <td>{formatNumber(earning.estimatedEPS)}</td>
                  <td className={earning.surprise >= 0 ? 'positive' : 'negative'}>
                    {formatNumber(earning.surprise)}
                  </td>
                  <td className={earning.surprisePercentage >= 0 ? 'positive' : 'negative'}>
                    {formatPercentage(earning.surprisePercentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockMetrics; 