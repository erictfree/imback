import { IncomingMessage, ServerResponse } from 'http';
import { getPinCount } from '../store/pinStore.js';
import { sendJson } from '../utils/response.js';
import { config } from '../utils/config.js';

export async function handleAlive(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const count = getPinCount();
  console.log(`HEALTH CHECK: ${count} pins in memory`);
  sendJson(res, 200, {
    alive: true,
    pinsCount: count,
    expirationHours: config.pinExpirationHours,
    now: new Date().toISOString(),
  });
}
