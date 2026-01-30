import { IncomingMessage, ServerResponse } from 'http';
import { sendJson, sendValidationError, sendInternalError } from '../utils/response.js';
import { radioHeartbeat, getRadioCount } from '../store/radioStore.js';

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export async function handlePostRadio(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  let body: unknown;

  try {
    body = await parseBody(req);
  } catch {
    sendValidationError(res, 'Invalid JSON in request body');
    return;
  }

  const data = body as Record<string, unknown>;

  if (!data || typeof data.id !== 'string' || data.id.trim() === '') {
    sendValidationError(res, 'id is required and must be a non-empty string');
    return;
  }

  try {
    radioHeartbeat(data.id);
    const count = getRadioCount();
    console.log(`RADIO HEARTBEAT: ${data.id} | listeners: ${count}`);
    sendJson(res, 200, { ok: true, count });
  } catch (err) {
    console.error('Error processing radio heartbeat:', err);
    sendInternalError(res);
  }
}
