import { IncomingMessage, ServerResponse } from 'http';
import { deletePin } from '../store/pinStore.js';
import { sendJson } from '../utils/response.js';

interface RouteParams {
  deviceId?: string;
}

export async function handleDeletePin(
  _req: IncomingMessage,
  res: ServerResponse,
  params: RouteParams
): Promise<void> {
  const { deviceId } = params;

  if (!deviceId) {
    sendJson(res, 404, { error: 'Pin not found' });
    return;
  }

  const deleted = deletePin(deviceId);

  if (!deleted) {
    console.log(`DELETE PIN: ${deviceId} | NOT FOUND`);
    sendJson(res, 404, { error: 'Pin not found' });
    return;
  }

  console.log(`DELETE PIN: ${deviceId} | DELETED`);
  sendJson(res, 200, { success: true });
}
