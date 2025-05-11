import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './StockMetrics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StockMetrics = ({ overview, earnings, peData, symbol }) => {
  const formatNumber = (value) => {
    if (value === 'N/A' || value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (value === 'N/A' || value === undefined || value === null) return 'N/A';
    return `${formatNumber(value)}%`;
  };

  const formatCurrency = (value) => {
    if (value === 'N/A' || value === undefined || value === null) return 'N/A';
    return `$${formatNumber(value)}`;
  };

  const formatMarketCap = (value) => {
    if (value === 'N/A' || value === undefined || value === null) return 'N/A';
    const billions = value / 1000000000;
    return `$${formatNumber(billions)}B`;
  };

  const earningsChartData = {
    labels: earnings?.quarterly?.slice(0, 20).map(earning => 
      new Date(earning.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
    ).reverse() || [],
    datasets: [
      {
        label: 'Reported EPS',
        data: earnings?.quarterly?.slice(0, 20).map(earning => earning.reportedEPS).reverse() || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      },
      {
        label: 'Estimated EPS',
        data: earnings?.quarterly?.slice(0, 20).map(earning => earning.estimatedEPS).reverse() || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }
    ]
  };

  const earningsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'rect'
        }
      },
      title: {
        display: true,
        text: '5-Year Quarterly Earnings Per Share',
        color: '#fff',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 4,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            const index = context.dataIndex;
            const surprise = earnings?.quarterly?.[19 - index]?.surprisePercentage;
            const surpriseText = surprise ? ` (${surprise >= 0 ? '+' : ''}${surprise.toFixed(2)}%)` : '';
            return `${label}: $${value.toFixed(2)}${surpriseText}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#a0a0a0',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11
          },
          callback: (value, index) => {
            const date = new Date(earnings?.quarterly?.[19 - index]?.date);
            return date.getFullYear() === new Date().getFullYear() 
              ? date.toLocaleDateString('en-US', { month: 'short' })
              : date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#a0a0a0',
          callback: (value) => `$${value.toFixed(2)}`
        }
      }
    }
  };

  // Calculate earnings statistics
  const latestEarnings = earnings?.quarterly?.[0];
  const lastYearEarnings = earnings?.quarterly?.slice(0, 4);
  const lastYearAvg = lastYearEarnings?.reduce((acc, curr) => acc + curr.reportedEPS, 0) / 4;
  const fiveYearEarnings = earnings?.quarterly?.slice(0, 20);
  const fiveYearAvg = fiveYearEarnings?.reduce((acc, curr) => acc + curr.reportedEPS, 0) / 20;
  const yoyGrowth = lastYearEarnings && fiveYearEarnings ? 
    ((lastYearAvg - fiveYearAvg) / Math.abs(fiveYearAvg)) * 100 : 0;

  return (
    <div className="stock-metrics">
      <div className="metrics-section">
        <h2>Company Overview</h2>
        <div className="overview-grid">
          <div className="overview-item">
            <span className="overview-label">Company Name</span>
            <span className="overview-value">{overview?.Name || 'N/A'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Sector</span>
            <span className="overview-value">{overview?.Sector || 'N/A'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Industry</span>
            <span className="overview-value">{overview?.Industry || 'N/A'}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Market Cap</span>
            <span className="overview-value">{formatMarketCap(overview?.MarketCapitalization)}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">52 Week High</span>
            <span className="overview-value">{formatCurrency(overview?.['52WeekHigh'])}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">52 Week Low</span>
            <span className="overview-value">{formatCurrency(overview?.['52WeekLow'])}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">50 Day Moving Average</span>
            <span className="overview-value">{formatCurrency(overview?.['50DayMovingAverage'])}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">200 Day Moving Average</span>
            <span className="overview-value">{formatCurrency(overview?.['200DayMovingAverage'])}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Shares Outstanding</span>
            <span className="overview-value">{formatNumber(overview?.SharesOutstanding)}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Beta</span>
            <span className="overview-value">{formatNumber(overview?.Beta)}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Dividend Yield</span>
            <span className="overview-value">{formatPercentage(overview?.DividendYield)}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Dividend Per Share</span>
            <span className="overview-value">{formatCurrency(overview?.DividendPerShare)}</span>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h2>Valuation Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-item">
            <span className="metric-label">P/E Ratio (TTM)</span>
            <span className="metric-value">{formatNumber(overview?.PERatio)}</span>
            <span className="metric-description">Price to Earnings Ratio (Trailing Twelve Months)</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Forward P/E</span>
            <span className="metric-value">{formatNumber(overview?.ForwardPE)}</span>
            <span className="metric-description">Forward Price to Earnings Ratio</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">PEG Ratio</span>
            <span className="metric-value">{formatNumber(overview?.PEGRatio)}</span>
            <span className="metric-description">Price/Earnings to Growth Ratio</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Price to Book</span>
            <span className="metric-value">{formatNumber(overview?.PriceToBookRatio)}</span>
            <span className="metric-description">Price to Book Value Ratio</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Price to Sales</span>
            <span className="metric-value">{formatNumber(overview?.PriceToSalesRatio)}</span>
            <span className="metric-description">Price to Sales Ratio</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">EV/EBITDA</span>
            <span className="metric-value">{formatNumber(overview?.EVToEBITDA)}</span>
            <span className="metric-description">Enterprise Value to EBITDA Ratio</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Profit Margin</span>
            <span className="metric-value">{formatPercentage(overview?.ProfitMargin)}</span>
            <span className="metric-description">Net Profit Margin</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Operating Margin</span>
            <span className="metric-value">{formatPercentage(overview?.OperatingMarginTTM)}</span>
            <span className="metric-description">Operating Margin TTM</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Return on Equity</span>
            <span className="metric-value">{formatPercentage(overview?.ReturnOnEquityTTM)}</span>
            <span className="metric-description">ROE TTM</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Return on Assets</span>
            <span className="metric-value">{formatPercentage(overview?.ReturnOnAssetsTTM)}</span>
            <span className="metric-description">ROA TTM</span>
          </div>
        </div>
      </div>

      <div className="metrics-section">
        <h2>Quarterly Earnings</h2>
        <div className="earnings-chart-container">
          <Bar data={earningsChartData} options={earningsChartOptions} />
        </div>
        <div className="earnings-summary">
          <div className="summary-item">
            <span className="summary-label">Latest EPS</span>
            <span className="summary-value">{formatCurrency(latestEarnings?.reportedEPS)}</span>
            <span className="summary-description">
              {latestEarnings?.surprisePercentage ? 
                `Surprise: ${latestEarnings.surprisePercentage >= 0 ? '+' : ''}${formatPercentage(latestEarnings.surprisePercentage)}` : 
                'No surprise data available'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Last Year Average</span>
            <span className="summary-value">{formatCurrency(lastYearAvg)}</span>
            <span className="summary-description">Average EPS for the last 4 quarters</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">5-Year Average</span>
            <span className="summary-value">{formatCurrency(fiveYearAvg)}</span>
            <span className="summary-description">
              {yoyGrowth ? 
                `YoY Growth: ${yoyGrowth >= 0 ? '+' : ''}${formatPercentage(yoyGrowth)}` : 
                'Growth data not available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockMetrics; 