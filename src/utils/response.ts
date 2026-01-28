import { ServerResponse } from 'http';
import { ErrorCode, ErrorResponse } from '../types.js';

export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function sendError(res: ServerResponse, statusCode: number, errorCode: ErrorCode, message: string): void {
  const error: ErrorResponse = { errorCode, message };
  sendJson(res, statusCode, error);
}

export function sendOk(res: ServerResponse): void {
  sendJson(res, 200, { ok: true });
}

export function sendNotFound(res: ServerResponse, message = 'Not found'): void {
  sendError(res, 404, 'NOT_FOUND', message);
}

export function sendValidationError(res: ServerResponse, message: string): void {
  sendError(res, 400, 'VALIDATION_ERROR', message);
}

export function sendRateLimited(res: ServerResponse): void {
  sendError(res, 429, 'RATE_LIMITED', 'Too many requests');
}

export function sendInternalError(res: ServerResponse, message = 'Internal server error'): void {
  sendError(res, 500, 'INTERNAL_ERROR', message);
}
