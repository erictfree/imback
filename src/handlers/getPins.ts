import { IncomingMessage, ServerResponse } from 'http';
import { getAllPins } from '../store/pinStore.js';
import { sendJson } from '../utils/response.js';
import { PinResponse } from '../types.js';

export async function handleGetPins(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const allPins = getAllPins();

  const pins: PinResponse[] = allPins.map((pin) => ({
    deviceId: pin.deviceId,
    latitude: pin.latitude,
    longitude: pin.longitude,
    timestamp: pin.timestamp,
    playlistName: pin.playlistName,
  }));

  console.log(`GET PINS: returning ${pins.length} pins`);
  sendJson(res, 200, { pins });
}
