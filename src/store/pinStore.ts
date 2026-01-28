import { PinRecord } from '../types.js';
import { config } from '../utils/config.js';

const pins = new Map<string, PinRecord>();
let warningLogged = false;

export function isExpired(timestamp: string): boolean {
  const pinTime = new Date(timestamp).getTime();
  const expirationMs = config.pinExpirationHours * 60 * 60 * 1000;
  const cutoff = Date.now() - expirationMs;
  return pinTime < cutoff;
}

export function setPin(record: PinRecord): void {
  pins.set(record.deviceId, record);
  checkPinCount();
}

export function getPin(deviceId: string): PinRecord | null {
  const pin = pins.get(deviceId);
  if (!pin) return null;

  if (isExpired(pin.timestamp)) {
    pins.delete(deviceId);
    return null;
  }

  return pin;
}

export function getAllPins(): PinRecord[] {
  const result: PinRecord[] = [];

  for (const [deviceId, pin] of pins) {
    if (isExpired(pin.timestamp)) {
      pins.delete(deviceId);
    } else {
      result.push(pin);
    }
  }

  return result;
}

export function deletePin(deviceId: string): boolean {
  return pins.delete(deviceId);
}

export function getPinCount(): number {
  return pins.size;
}

export function purgeExpired(): number {
  let purged = 0;

  for (const [deviceId, pin] of pins) {
    if (isExpired(pin.timestamp)) {
      pins.delete(deviceId);
      purged++;
    }
  }

  return purged;
}

function checkPinCount(): void {
  const count = pins.size;
  if (count > config.pinCountWarningThreshold && !warningLogged) {
    console.error(`Warning: Pin count (${count}) exceeds threshold (${config.pinCountWarningThreshold})`);
    warningLogged = true;
  } else if (count <= config.pinCountWarningThreshold) {
    warningLogged = false;
  }
}

export function startPurgeInterval(): NodeJS.Timeout {
  const PURGE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  return setInterval(() => {
    const purged = purgeExpired();
    if (purged > 0) {
      console.log(`Purged ${purged} expired pins`);
    }
  }, PURGE_INTERVAL_MS);
}

export function startStatusInterval(): NodeJS.Timeout {
  const STATUS_INTERVAL_MS = 60 * 1000; // 1 minute

  return setInterval(() => {
    const count = pins.size;
    const playlists = new Map<string, number>();

    for (const pin of pins.values()) {
      playlists.set(pin.playlistName, (playlists.get(pin.playlistName) || 0) + 1);
    }

    const playlistSummary = Array.from(playlists.entries())
      .map(([name, c]) => `${name}: ${c}`)
      .join(', ');

    console.log(`[STATUS] ${count} pins | ${playlists.size} playlists | ${playlistSummary || 'none'}`);
  }, STATUS_INTERVAL_MS);
}
