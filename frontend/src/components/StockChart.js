import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './StockChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StockChart = ({ historicalData, symbol }) => {
  const [timeInterval, setTimeInterval] = useState('1D');

  const chartData = {
    labels: historicalData.map(point => 
      new Date(point.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    ),
    datasets: [
      {
        label: `${symbol} Price`,
        data: historicalData.map(point => point.price),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${symbol} Stock Price`
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <div className="stock-chart">
      <div className="chart-controls">
        <button 
          className={timeInterval === '1D' ? 'active' : ''} 
          onClick={() => setTimeInterval('1D')}
        >
          1D
        </button>
        <button 
          className={timeInterval === '1W' ? 'active' : ''} 
          onClick={() => setTimeInterval('1W')}
        >
          1W
        </button>
        <button 
          className={timeInterval === '1M' ? 'active' : ''} 
          onClick={() => setTimeInterval('1M')}
        >
          1M
        </button>
        <button 
          className={timeInterval === '3M' ? 'active' : ''} 
          onClick={() => setTimeInterval('3M')}
        >
          3M
        </button>
        <button 
          className={timeInterval === 'YTD' ? 'active' : ''} 
          onClick={() => setTimeInterval('YTD')}
        >
          YTD
        </button>
        <button 
          className={timeInterval === '1Y' ? 'active' : ''} 
          onClick={() => setTimeInterval('1Y')}
        >
          1Y
        </button>
        <button 
          className={timeInterval === '5Y' ? 'active' : ''} 
          onClick={() => setTimeInterval('5Y')}
        >
          5Y
        </button>
      </div>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default StockChart; 