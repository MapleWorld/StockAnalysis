import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  BarElement
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { enUS } from 'date-fns/locale';
import './StockChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  BarElement
);

const StockChart = ({ historicalData, intradayData, selectedInterval }) => {
  const filteredData = useMemo(() => {
    if (!historicalData) return [];
    
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    const threeMonths = 3 * oneMonth;
    const oneYear = 365 * oneDay;
    const fiveYears = 5 * oneYear;
    
    // For 1D view, use intraday data if available, otherwise use daily data
    if (selectedInterval === '1D') {
      if (intradayData && intradayData.length > 0) {
        return intradayData.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp).setHours(0, 0, 0, 0) + new Date(item.timestamp).getHours() * 60 * 60 * 1000 + new Date(item.timestamp).getMinutes() * 60 * 1000
        }));
      }
      // If no intraday data, use the last day's data from historical data
      return historicalData.filter(item => {
        const diff = now - item.timestamp;
        return diff <= oneDay;
      }).map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).setHours(0, 0, 0, 0)
      }));
    }
    
    // For other intervals, use historical data
    return historicalData.filter(item => {
      const diff = now - item.timestamp;
      switch (selectedInterval) {
        case '1W': return diff <= oneWeek;
        case '1M': return diff <= oneMonth;
        case '3M': return diff <= threeMonths;
        case 'YTD': return new Date(item.timestamp).getFullYear() === new Date().getFullYear();
        case '1Y': return diff <= oneYear;
        case '5Y': return diff <= fiveYears;
        default: return true;
      }
    }).map(item => ({
      ...item,
      timestamp: new Date(item.timestamp).setHours(0, 0, 0, 0)
    }));
  }, [historicalData, intradayData, selectedInterval]);

  const chartData = {
    datasets: [
      {
        label: 'Stock Price',
        data: filteredData.map(item => ({
          x: item.timestamp,
          o: item.open || item.price,
          h: item.high || item.price,
          l: item.low || item.price,
          c: item.price
        })),
        borderColor: 'rgb(97, 218, 251)',
        backgroundColor: 'rgba(97, 218, 251, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0,
        type: 'candlestick'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Stock Price (${selectedInterval})`,
        color: '#fff',
        font: {
          size: 16
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(97, 218, 251, 0.2)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: function(context) {
            const date = new Date(context[0].parsed.x);
            switch (selectedInterval) {
              case '1D':
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              case '1W':
                return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
              case '1M':
              case '3M':
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              case 'YTD':
              case '1Y':
              case '5Y':
                return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
              default:
                return date.toLocaleDateString();
            }
          },
          label: function(context) {
            const data = context[0].raw;
            return [
              `Open: $${data.o.toFixed(2)}`,
              `High: $${data.h.toFixed(2)}`,
              `Low: $${data.l.toFixed(2)}`,
              `Close: $${data.c.toFixed(2)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: selectedInterval === '1D' ? 'minute' : 'day',
          displayFormats: {
            minute: 'HH:mm',
            day: 'MMM d'
          }
        },
        adapters: {
          date: {
            locale: enUS
          }
        },
        grid: {
          display: false
        },
        ticks: {
          color: '#fff',
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: selectedInterval === '1D' ? 12 : 8
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff',
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    }
  };

  return (
    <div className="stock-chart">
      <div className="chart-container">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default StockChart; 