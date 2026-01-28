export interface Config {
  port: number;
  pinExpirationHours: number;
  rateLimitPerSecond: number;
  pinCountWarningThreshold: number;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    pinExpirationHours: parseInt(process.env.PIN_EXPIRATION_HOURS || '24', 10),
    rateLimitPerSecond: parseInt(process.env.RATE_LIMIT_PER_SECOND || '100', 10),
    pinCountWarningThreshold: parseInt(process.env.PIN_COUNT_WARNING_THRESHOLD || '2000', 10),
  };
}

export const config = loadConfig();
