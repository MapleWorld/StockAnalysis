import { cacheService } from './cacheService';
import { rateLimiter } from './rateLimiter';

const PRIMARY_API_KEY = 'MUEGFLIKNM1EK9QE';
const SECONDARY_API_KEY = 'ZZSV0L0O83VB3YU7';
const TERTIARY_API_KEY = 'HYALHCB1H1SYONAP';
const QUARTERNARY_API_KEY = 'FMUZSKJXV6Y4DCP9';
const QUINARY_API_KEY = 'YFLTUS975LJTHNA3';
const BASE_URL = 'https://www.alphavantage.co/query';

// Keep track of which API key to use next
let currentApiKeyIndex = 0;
const API_KEYS = [PRIMARY_API_KEY, SECONDARY_API_KEY, TERTIARY_API_KEY, QUARTERNARY_API_KEY, QUINARY_API_KEY];

const getNextApiKey = () => {
  const key = API_KEYS[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
  return key;
};

const fetchWithApiKey = async (params, apiKey) => {
  const response = await fetch(`${BASE_URL}?${params}&apikey=${apiKey}`);
  const data = await response.json();
  
  if (data['Error Message']) {
    throw new Error(data['Error Message']);
  }

  if (data['Note'] && (
    data['Note'].includes('API call frequency') || 
    data['Note'].includes('API rate limit') ||
    data['Note'].includes('API key') ||
    data['Note'].includes('25 requests per day')
  )) {
    throw new Error('RATE_LIMIT');
  }

  return data;
};

const fetchWithRetry = async (params) => {
  try {
    const apiKey = getNextApiKey();
    console.log(`Using API key ${currentApiKeyIndex} of ${API_KEYS.length}`);
    return await fetchWithApiKey(params, apiKey);
  } catch (error) {
    if (error.message !== 'RATE_LIMIT') {
      throw error;
    }
  }
};

export const TIME_SERIES_INTERVALS = {
  '1D': 'TIME_SERIES_INTRADAY',
  '1W': 'TIME_SERIES_INTRADAY',
  '1M': 'TIME_SERIES_DAILY',
  '3M': 'TIME_SERIES_DAILY',
  'YTD': 'TIME_SERIES_DAILY',
  '1Y': 'TIME_SERIES_DAILY',
  '5Y': 'TIME_SERIES_DAILY'
};

export const fetchAllStockData = async (symbol) => {
  try {
    // Check cache first
    const cacheKey = `all_data_${symbol}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Check rate limit
    await rateLimiter.checkLimit();

    // Single API call to get all data
    const response = await fetchWithRetry(`function=GLOBAL_QUOTE&symbol=${symbol}`);

    // Debug logging
    console.log('API Response:', response);

    if (!response || !response['Global Quote']) {
      console.error('API Response Structure:', response);
      if (response['Error Message']) {
        throw new Error(response['Error Message']);
      }
      if (response['Note']) {
        throw new Error(response['Note']);
      }
      throw new Error('No data available for this symbol');
    }

    const quote = response['Global Quote'];

    // Process the data
    const processedData = {
      symbol,
      quote: {
        price: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
        volume: parseInt(quote['06. volume']) || 0
      },
      overview: {
        name: symbol,
        description: 'No description available',
        sector: 'N/A',
        marketCap: 0,
        dividendYield: 0,
        dividendPerShare: 0,
        payoutRatio: 0
      },
      earnings: {
        quarterly: [{
          date: new Date().toISOString().split('T')[0],
          reportedEPS: 0,
          estimatedEPS: 0,
          surprise: 0,
          surprisePercentage: 0
        }]
      },
      peData: {
        currentPE: 0,
        forwardPE: 0,
        pegRatio: 0,
        priceToBookRatio: 0,
        priceToSalesRatio: 0
      },
      historicalData: [{
        timestamp: new Date().getTime(),
        price: parseFloat(quote['05. price']) || 0
      }]
    };

    // Cache the processed data
    cacheService.set(cacheKey, processedData);
    return processedData;

  } catch (error) {
    console.error('Error fetching stock data:', error);
    if (error.message === 'RATE_LIMIT') {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch stock data: ${error.message}`);
  }
};

// Helper function to calculate moving average
const calculateMovingAverage = (data, period) => {
  if (data.length < period) return 'N/A';
  const prices = data.slice(-period).map(d => d.price);
  return prices.reduce((a, b) => a + b, 0) / period;
};