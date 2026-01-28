import { ValidationError, PinInput } from '../types.js';
import { config } from './config.js';

export function validateDeviceId(deviceId: unknown): ValidationError | null {
  if (typeof deviceId !== 'string' || deviceId.trim() === '') {
    return { field: 'deviceId', message: 'deviceId must be a non-empty string' };
  }
  return null;
}

export function validateLatitude(latitude: unknown): ValidationError | null {
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    return { field: 'latitude', message: 'latitude must be a number' };
  }
  if (latitude < -90 || latitude > 90) {
    return { field: 'latitude', message: 'latitude must be between -90 and 90' };
  }
  return null;
}

export function validateLongitude(longitude: unknown): ValidationError | null {
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    return { field: 'longitude', message: 'longitude must be a number' };
  }
  if (longitude < -180 || longitude > 180) {
    return { field: 'longitude', message: 'longitude must be between -180 and 180' };
  }
  return null;
}

export function validateTimestamp(timestamp: unknown): ValidationError | null {
  if (typeof timestamp !== 'string') {
    return { field: 'timestamp', message: 'timestamp must be a string' };
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return { field: 'timestamp', message: 'timestamp must be a valid ISO-8601 string' };
  }

  const now = Date.now();
  const timestampMs = date.getTime();

  // Reject future timestamps (with 1 minute tolerance for clock skew)
  if (timestampMs > now + 60000) {
    return { field: 'timestamp', message: 'timestamp cannot be in the future' };
  }

  // Reject already-expired timestamps
  const expirationMs = config.pinExpirationHours * 60 * 60 * 1000;
  if (timestampMs < now - expirationMs) {
    return { field: 'timestamp', message: 'timestamp is already expired' };
  }

  return null;
}

export function validatePlaylistName(playlistName: unknown): ValidationError | null {
  if (typeof playlistName !== 'string' || playlistName.trim() === '') {
    return { field: 'playlistName', message: 'playlistName must be a non-empty string' };
  }
  return null;
}

export function validatePinInput(body: unknown): { data: PinInput } | { error: ValidationError } {
  if (!body || typeof body !== 'object') {
    return { error: { field: 'body', message: 'request body must be a JSON object' } };
  }

  const obj = body as Record<string, unknown>;

  const validators = [
    () => validateDeviceId(obj.deviceId),
    () => validateLatitude(obj.latitude),
    () => validateLongitude(obj.longitude),
    () => validateTimestamp(obj.timestamp),
    () => validatePlaylistName(obj.playlistName),
  ];

  for (const validate of validators) {
    const error = validate();
    if (error) return { error };
  }

  return {
    data: {
      deviceId: obj.deviceId as string,
      latitude: obj.latitude as number,
      longitude: obj.longitude as number,
      timestamp: obj.timestamp as string,
      playlistName: obj.playlistName as string,
    },
  };
}
