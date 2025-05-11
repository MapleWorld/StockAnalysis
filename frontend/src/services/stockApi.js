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

const getLocalData = async (functionName, symbol) => {
  try {
    const url = `/data/${symbol.toLowerCase()}_${functionName.toLowerCase()}.json`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`No local data available for ${symbol} ${functionName}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(`Local data not found for ${symbol} ${functionName}, falling back to API...`);
    return null;
  }
};

const fetchWithApiKey = async (params) => {
  const functionMatch = params.match(/function=([^&]+)/);
  const symbolMatch = params.match(/symbol=([^&]+)/);
  
  if (!functionMatch || !symbolMatch) {
    throw new Error('Invalid API parameters');
  }
  
  const functionName = functionMatch[1];
  const symbol = symbolMatch[1];
  
  const functionMap = {
    'OVERVIEW': 'overview',
    'EARNINGS': 'earnings',
    'TIME_SERIES_DAILY': 'timeseries',
    'TIME_SERIES_INTRADAY': 'intraday'
  };
  
  const localFunctionName = functionMap[functionName];
  if (!localFunctionName) {
    throw new Error(`No local data mapping available for function: ${functionName}`);
  }
  
  const localData = await getLocalData(localFunctionName, symbol);
  if (localData) {
    return localData;
  }
  
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
    throw new Error('API rate limit exceeded. Please try again later.');
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
    return await fetchWithApiKey(params);
  }
};

export const TIME_SERIES_INTERVALS = {
  '1D': 'TIME_SERIES_INTRADAY',
  '1W': 'TIME_SERIES_DAILY',
  '1M': 'TIME_SERIES_DAILY',
  '3M': 'TIME_SERIES_DAILY',
  'YTD': 'TIME_SERIES_DAILY',
  '1Y': 'TIME_SERIES_DAILY',
  '5Y': 'TIME_SERIES_DAILY'
};

export const fetchAllStockData = async (symbol) => {
  try {
    const cacheKey = `all_data_${symbol}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    await rateLimiter.checkLimit();

    const [overviewData, earningsData, timeSeriesData, intradayData] = await Promise.all([
      fetchWithRetry(`function=OVERVIEW&symbol=${symbol}`),
      fetchWithRetry(`function=EARNINGS&symbol=${symbol}`),
      fetchWithRetry(`function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact`),
      fetchWithRetry(`function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&outputsize=compact`)
    ]);
    
    if (!overviewData?.Name) throw new Error('No company overview data available');
    if (!earningsData?.quarterlyEarnings) throw new Error('No earnings data available');
    if (!timeSeriesData?.['Time Series (Daily)']) throw new Error('No historical data available');
    
    let processedIntradayData = [];
    if (intradayData?.['Time Series (5min)']) {
      const intradaySeries = intradayData['Time Series (5min)'];
      processedIntradayData = Object.entries(intradaySeries)
        .map(([date, values]) => ({
          timestamp: new Date(date).getTime(),
          price: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume']),
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low'])
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
    }

    const timeSeries = timeSeriesData['Time Series (Daily)'];
    const processedHistoricalData = Object.entries(timeSeries)
      .map(([date, values]) => ({
        timestamp: new Date(date).getTime(),
        price: parseFloat(values['4. close']),
        volume: parseInt(values['6. volume'])
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

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
      overview: overviewData,
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
      historicalData: processedHistoricalData,
      intradayData: processedIntradayData
    };

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
