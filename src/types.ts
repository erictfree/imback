export interface PinRecord {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  playlistName: string;
  payload: Record<string, unknown>;
}

export interface PinInput {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  playlistName: string;
}

export interface PinResponse {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  playlistName: string;
}

export interface ErrorResponse {
  errorCode: ErrorCode;
  message: string;
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ValidationError {
  field: string;
  message: string;
}
