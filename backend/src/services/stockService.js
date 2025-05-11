const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

async function getStockQuote(symbol) {
  const cacheKey = `quote_${symbol}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: API_KEY
      }
    });

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    const quote = response.data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
      throw new Error('No data found for symbol');
    }

    const stockData = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume'])
    };

    cache.set(cacheKey, stockData);
    return stockData;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    throw error;
  }
}

async function getStockOverview(symbol) {
  const cacheKey = `overview_${symbol}`;
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'OVERVIEW',
        symbol,
        apikey: API_KEY
      }
    });

    if (response.data['Error Message']) {
      throw new Error(response.data['Error Message']);
    }

    if (Object.keys(response.data).length === 0) {
      throw new Error('No data found for symbol');
    }

    const overview = {
      symbol: response.data.Symbol,
      companyName: response.data.Name,
      sector: response.data.Sector,
      marketCap: parseFloat(response.data.MarketCapitalization),
      peRatio: response.data.PERatio === 'None' ? 'N/A' : parseFloat(response.data.PERatio),
      forwardPE: response.data.ForwardPE === 'None' ? 'N/A' : parseFloat(response.data.ForwardPE),
      dividendYield: response.data.DividendYield === 'None' ? 'N/A' : parseFloat(response.data.DividendYield),
      dividendPerShare: response.data.DividendPerShare === 'None' ? 'N/A' : parseFloat(response.data.DividendPerShare),
      payoutRatio: response.data.PayoutRatio === 'None' ? 'N/A' : parseFloat(response.data.PayoutRatio)
    };

    cache.set(cacheKey, overview);
    return overview;
  } catch (error) {
    console.error('Error fetching stock overview:', error);
    throw error;
  }
}

async function getStockData(symbol) {
  try {
    const [quote, overview] = await Promise.all([
      getStockQuote(symbol),
      getStockOverview(symbol)
    ]);

    return {
      ...quote,
      ...overview
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

module.exports = {
  getStockData
}; 