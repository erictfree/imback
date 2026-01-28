import { IncomingMessage, ServerResponse } from 'http';
import { handlePostPin } from './handlers/postPin.js';
import { handleGetPin } from './handlers/getPin.js';
import { handleGetPins } from './handlers/getPins.js';
import { handleAlive } from './handlers/alive.js';
import { sendNotFound } from './utils/response.js';

interface RouteParams {
  deviceId?: string;
}

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: RouteParams) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  handler: RouteHandler;
  paramNames: string[];
}

const routes: Route[] = [
  {
    method: 'POST',
    pattern: /^\/v1\/pin$/,
    handler: handlePostPin,
    paramNames: [],
  },
  {
    method: 'GET',
    pattern: /^\/v1\/pin\/([^/]+)$/,
    handler: handleGetPin,
    paramNames: ['deviceId'],
  },
  {
    method: 'GET',
    pattern: /^\/v1\/pins$/,
    handler: handleGetPins,
    paramNames: [],
  },
  {
    method: 'GET',
    pattern: /^\/v1\/alive$/,
    handler: handleAlive,
    paramNames: [],
  },
];

export async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';

  for (const routeDef of routes) {
    if (routeDef.method !== method) continue;

    const match = pathname.match(routeDef.pattern);
    if (!match) continue;

    const params: RouteParams = {};
    routeDef.paramNames.forEach((name, index) => {
      (params as Record<string, string>)[name] = decodeURIComponent(match[index + 1]);
    });

    await routeDef.handler(req, res, params);
    return;
  }

  sendNotFound(res, 'Route not found');
}
