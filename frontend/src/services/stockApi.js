import { cacheService } from './cacheService';
import { rateLimiter } from './rateLimiter';

const API_KEYS = [
  'MUEGFLIKNM1EK9QE',
  'ZZSV0L0O83VB3YU7',
  'HYALHCB1H1SYONAP',
  'FMUZSKJXV6Y4DCP9',
  'YFLTUS975LJTHNA3'
];

const BASE_URL = 'https://www.alphavantage.co/query';
let currentApiKeyIndex = 0;

const getNextApiKey = () => {
  const key = API_KEYS[currentApiKeyIndex];
  currentApiKeyIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
  return key;
};

const fetchWithApiKey = async (params) => {
  const apiKey = getNextApiKey();
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
    return await fetchWithApiKey(params);
  } catch (error) {
    if (error.message !== 'RATE_LIMIT') {
      throw error;
    }
    // If we hit rate limit, try with next API key
    return await fetchWithApiKey(params);
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

    // Make separate API calls for different data types
    const [overviewData, earningsData, timeSeriesData] = await Promise.all([
      fetchWithRetry(`function=OVERVIEW&symbol=${symbol}`),
      fetchWithRetry(`function=EARNINGS&symbol=${symbol}`),
      fetchWithRetry(`function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact`)
    ]);

    // Validate responses
    if (!overviewData?.Name) throw new Error('No company overview data available');
    if (!earningsData?.quarterlyEarnings) throw new Error('No earnings data available');
    if (!timeSeriesData?.['Time Series (Daily)']) throw new Error('No historical data available');

    const timeSeries = timeSeriesData['Time Series (Daily)'];

    // Process historical data and get current price info
    const processedHistoricalData = Object.entries(timeSeries)
      .map(([date, values]) => ({
        timestamp: new Date(date).getTime(),
        price: parseFloat(values['4. close']),
        volume: parseInt(values['6. volume'])
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Get current price info from the most recent data point
    const currentData = processedHistoricalData[processedHistoricalData.length - 1];
    const previousData = processedHistoricalData[processedHistoricalData.length - 2];
    const priceChange = previousData ? currentData.price - previousData.price : 0;
    const priceChangePercent = previousData ? (priceChange / previousData.price) * 100 : 0;

    const processedData = {
      symbol,
      quote: {
        price: currentData.price,
        change: priceChange,
        changePercent: priceChangePercent,
        volume: currentData.volume
      },
      overview: {
        name: overviewData.Name,
        description: overviewData.Description || 'No description available',
        sector: overviewData.Sector || 'N/A',
        marketCap: parseFloat(overviewData.MarketCapitalization) || 0,
        dividendYield: parseFloat(overviewData.DividendYield) || 0,
        dividendPerShare: parseFloat(overviewData.DividendPerShare) || 0,
        payoutRatio: parseFloat(overviewData.PayoutRatio) || 0
      },
      earnings: {
        quarterly: earningsData.quarterlyEarnings.map(earning => ({
          date: earning.fiscalDateEnding,
          reportedEPS: parseFloat(earning.reportedEPS) || 0,
          estimatedEPS: parseFloat(earning.estimatedEPS) || 0,
          surprise: parseFloat(earning.surprise) || 0,
          surprisePercentage: parseFloat(earning.surprisePercentage) || 0
        }))
      },
      peData: {
        currentPE: parseFloat(overviewData.PERatio) || 0,
        forwardPE: parseFloat(overviewData.ForwardPE) || 0,
        pegRatio: parseFloat(overviewData.PEGRatio) || 0,
        priceToBookRatio: parseFloat(overviewData.PriceToBookRatio) || 0,
        priceToSalesRatio: parseFloat(overviewData.PriceToSalesRatio) || 0
      },
      historicalData: processedHistoricalData
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
