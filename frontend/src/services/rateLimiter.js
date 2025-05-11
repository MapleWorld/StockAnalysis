class RateLimiter {
  constructor(maxRequests = 5, timeWindow = 60000) { // 5 requests per minute
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    
    // Remove requests older than the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const timeToWait = this.timeWindow - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(timeToWait / 1000)} seconds before trying again.`);
    }
    
    this.requests.push(now);
    return true;
  }

  reset() {
    this.requests = [];
  }
}

export const rateLimiter = new RateLimiter(); 