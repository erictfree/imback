import { config } from '../utils/config.js';

const requestTimestamps: number[] = [];

export function isRateLimited(): boolean {
  const now = Date.now();
  const windowStart = now - 1000; // 1 second window

  // Remove timestamps outside the window
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift();
  }

  // Check if we're over the limit
  if (requestTimestamps.length >= config.rateLimitPerSecond) {
    return true;
  }

  // Record this request
  requestTimestamps.push(now);
  return false;
}
