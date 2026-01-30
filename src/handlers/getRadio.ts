import { IncomingMessage, ServerResponse } from 'http';
import { sendJson } from '../utils/response.js';
import { getRadioCount } from '../store/radioStore.js';

export async function handleGetRadio(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const count = getRadioCount();
  console.log(`GET RADIO: ${count} listeners`);
  sendJson(res, 200, { count });
}
