# Pins Backend API Specification

**Version:** 1.0.0
**Base URL:** `http://localhost:3000`

---

## Overview

A lightweight in-memory service for storing and retrieving device location pins. Pins automatically expire after a configurable period (default: 24 hours).

---

## Endpoints

### `GET /v1/alive`

Health check endpoint.

**Response:** `200 OK`

```json
{
  "alive": true,
  "pinsCount": 42,
  "expirationHours": 24,
  "now": "2026-01-27T22:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `alive` | `boolean` | Always `true` |
| `pinsCount` | `integer` | Current number of pins in memory |
| `expirationHours` | `integer` | Pin expiration setting |
| `now` | `string` | Current server time (ISO-8601) |

---

### `POST /v1/pin`

Create or update a pin for a device. If a pin already exists for the device, it is overwritten.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "deviceId": "8A3F2B1C-4D5E-6F7A-8B9C-0D1E2F3A4B5C",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2026-01-27T18:30:00Z",
  "playlistName": "Midnight Drift"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `deviceId` | `string` | Yes | Non-empty |
| `latitude` | `number` | Yes | -90 to 90 |
| `longitude` | `number` | Yes | -180 to 180 |
| `timestamp` | `string` | Yes | Valid ISO-8601, not in future, not expired |
| `playlistName` | `string` | Yes | Non-empty |

**Response:** `200 OK`

```json
{
  "ok": true
}
```

**Errors:**

| Status | Code | Example |
|--------|------|---------|
| 400 | `VALIDATION_ERROR` | `"latitude must be between -90 and 90"` |
| 429 | `RATE_LIMITED` | `"Too many requests"` |

---

### `GET /v1/pin/:deviceId`

Retrieve a specific pin by device ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | `string` | The device identifier |

**Response:** `200 OK`

Returns the full payload that was stored (the original POST body):

```json
{
  "deviceId": "8A3F2B1C-4D5E-6F7A-8B9C-0D1E2F3A4B5C",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2026-01-27T18:30:00Z",
  "playlistName": "Midnight Drift"
}
```

**Errors:**

| Status | Code | Description |
|--------|------|-------------|
| 404 | `NOT_FOUND` | Pin not found or expired |

---

### `DELETE /v1/pin/:deviceId`

Delete a pin by device ID.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deviceId` | `string` | The device identifier |

**Response:** `200 OK`

```json
{
  "success": true
}
```

**Errors:**

| Status | Response | Description |
|--------|----------|-------------|
| 404 | `{ "error": "Pin not found" }` | Pin not found |

---

### `GET /v1/pins`

Retrieve all non-expired pins for map display.

**Response:** `200 OK`

```json
{
  "pins": [
    {
      "deviceId": "8A3F2B1C-4D5E-6F7A-8B9C-0D1E2F3A4B5C",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timestamp": "2026-01-27T18:30:00Z",
      "playlistName": "Midnight Drift"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pins` | `array` | Array of pin objects |

**Pin Object:**

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | `string` | Unique device identifier |
| `latitude` | `number` | Latitude coordinate |
| `longitude` | `number` | Longitude coordinate |
| `timestamp` | `string` | When the pin was created (ISO-8601) |
| `playlistName` | `string` | Display name of the playlist |

---

## Data Types

### PinRecord (Internal)

```typescript
interface PinRecord {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  playlistName: string;
  payload: Record<string, unknown>;  // Original request body
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  errorCode: ErrorCode;
  message: string;
}

type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `NOT_FOUND` | 404 | Resource not found or expired |
| `RATE_LIMITED` | 429 | Global rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

**Error Response Format:**

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "latitude must be between -90 and 90"
}
```

---

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `PIN_EXPIRATION_HOURS` | `24` | Hours until a pin expires |
| `RATE_LIMIT_PER_SECOND` | `100` | Max requests per second (global) |
| `PIN_COUNT_WARNING_THRESHOLD` | `2000` | Log warning when exceeded |

---

## Behavior

### Pin Expiration

- Pins expire after `PIN_EXPIRATION_HOURS` (default: 24)
- Expired pins are **not returned** from any endpoint
- Expired pins are purged:
  - Every 5 minutes (background task)
  - On read operations (opportunistic)

### Upsert Semantics

- `POST /v1/pin` uses upsert by `deviceId`
- If a pin exists for the device, it is replaced
- Only the latest pin per device is stored

### Rate Limiting

- Global rate limit (all requests combined)
- Uses sliding window algorithm
- Returns `429` when limit exceeded

### Data Persistence

- **None** — all data is in-memory
- Server restart clears all pins

---

## Examples

### Create a Pin

```bash
curl -X POST http://localhost:3000/v1/pin \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ABC-123",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "timestamp": "2026-01-27T20:00:00Z",
    "playlistName": "Chill Vibes"
  }'
```

### Get All Pins

```bash
curl http://localhost:3000/v1/pins
```

### Get Single Pin

```bash
curl http://localhost:3000/v1/pin/ABC-123
```

### Health Check

```bash
curl http://localhost:3000/v1/alive
```
