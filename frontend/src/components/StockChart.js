import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import './StockChart.css';

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
          x: new Date(item.timestamp),
          y: [
            item.open || item.price,
            item.high || item.price,
            item.low || item.price,
            item.price
          ]
        }));
      }
      // If no intraday data, use the last day's data from historical data
      return historicalData.filter(item => {
        const diff = now - item.timestamp;
        return diff <= oneDay;
      }).map(item => ({
        x: new Date(item.timestamp),
        y: [item.price, item.price, item.price, item.price]
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
      x: new Date(item.timestamp),
      y: [
        item.open || item.price,
        item.high || item.price,
        item.low || item.price,
        item.price
      ]
    }));
  }, [historicalData, intradayData, selectedInterval]);

  const options = {
    chart: {
      type: 'candlestick',
      height: 400,
      background: '#282c34',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      }
    },
    title: {
      text: 'Stock Price',
      align: 'left',
      style: {
        color: '#fff'
      }
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: '#fff'
        }
      }
    },
    yaxis: {
      tooltip: {
        enabled: true
      },
      labels: {
        style: {
          colors: '#fff'
        }
      }
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#4caf50',
          downward: '#f44336'
        }
      }
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: selectedInterval === '1D' ? 'HH:mm' : 'MMM dd, yyyy'
      }
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 4
    }
  };

  return (
    <div className="stock-chart">
      <div className="chart-container">
        <ReactApexChart
          options={options}
          series={[{ data: filteredData }]}
          type="candlestick"
          height={400}
        />
      </div>
    </div>
  );
};

export default StockChart; 