import { IncomingMessage, ServerResponse } from 'http';
import { getPin } from '../store/pinStore.js';
import { sendJson, sendNotFound } from '../utils/response.js';

interface RouteParams {
  deviceId?: string;
}

export async function handleGetPin(
  _req: IncomingMessage,
  res: ServerResponse,
  params: RouteParams
): Promise<void> {
  const { deviceId } = params;

  if (!deviceId) {
    sendNotFound(res, 'Device ID required');
    return;
  }

  const pin = getPin(deviceId);

  if (!pin) {
    console.log(`GET PIN: ${deviceId} | NOT FOUND`);
    sendNotFound(res, 'Pin not found or expired');
    return;
  }

  console.log(`GET PIN: ${deviceId} | ${pin.playlistName} | (${pin.latitude}, ${pin.longitude})`);
  sendJson(res, 200, pin.payload);
}
