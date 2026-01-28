import { IncomingMessage, ServerResponse } from 'http';
import { validatePinInput } from '../utils/validation.js';
import { sendOk, sendValidationError, sendInternalError } from '../utils/response.js';
import { setPin } from '../store/pinStore.js';
import { PinRecord } from '../types.js';

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

export async function handlePostPin(
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

  const result = validatePinInput(body);

  if ('error' in result) {
    console.log(`VALIDATION FAILED: ${result.error.message}`, JSON.stringify(body));
    sendValidationError(res, result.error.message);
    return;
  }

  const { data } = result;

  const record: PinRecord = {
    deviceId: data.deviceId,
    latitude: data.latitude,
    longitude: data.longitude,
    timestamp: data.timestamp,
    playlistName: data.playlistName,
    payload: body as Record<string, unknown>,
  };

  try {
    setPin(record);
    console.log(`PIN UPDATED: ${data.deviceId} | ${data.playlistName} | (${data.latitude}, ${data.longitude}) | ${data.timestamp}`);
    sendOk(res);
  } catch (err) {
    console.error('Error storing pin:', err);
    sendInternalError(res);
  }
}
