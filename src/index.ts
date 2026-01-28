import { createServer, IncomingMessage, ServerResponse } from 'http';
import { config } from './utils/config.js';
import { route } from './router.js';
import { isRateLimited } from './middleware/rateLimit.js';
import { sendRateLimited, sendInternalError } from './utils/response.js';
import { startPurgeInterval, startStatusInterval } from './store/pinStore.js';

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const start = Date.now();
  const method = req.method || 'GET';
  const url = req.url || '/';

  // Check rate limit
  if (isRateLimited()) {
    console.log(`${method} ${url} 429 - Rate limited`);
    sendRateLimited(res);
    return;
  }

  try {
    await route(req, res);
    const duration = Date.now() - start;
    console.log(`${method} ${url} ${res.statusCode} ${duration}ms`);
  } catch (err) {
    const duration = Date.now() - start;
    console.log(`${method} ${url} 500 ${duration}ms`);
    console.error('Unhandled error:', err);
    sendInternalError(res);
  }
}

const server = createServer((req, res) => {
  handleRequest(req, res).catch((err) => {
    console.error('Fatal error:', err);
    if (!res.headersSent) {
      sendInternalError(res);
    }
  });
});

// Start periodic tasks
startPurgeInterval();
startStatusInterval();

server.listen(config.port, () => {
  console.error(`Pins backend running on port ${config.port}`);
  console.error(`Pin expiration: ${config.pinExpirationHours} hours`);
  console.error(`Rate limit: ${config.rateLimitPerSecond} req/sec`);
  console.error(`Warning threshold: ${config.pinCountWarningThreshold} pins`);
});
