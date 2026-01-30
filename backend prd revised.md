# PRD: Pins Backend Service

**Version:** 2.0
**Date:** 2026-01-27

---

## 1. Purpose

A lightweight Node.js service that collects location "pins" from iOS client devices and exposes them for:

- Per-device retrieval
- Global map visualization
- Health checks

The service is stateless beyond memory, stores only coordinates (no place names), and automatically expires old pins.

---

## 2. Design Principles

| Principle | Description |
|-----------|-------------|
| **Coordinates are canonical** | Latitude/longitude are the only authoritative location data |
| **No place-name inference** | Backend never determines cities, regions, or human-readable locations |
| **Client-derived presentation** | Any labels are derived client-side via iOS reverse geocoding |
| **Ephemeral data** | Pins automatically expire and are purged from memory |
| **Simple data model** | Pins contain only location, timestamp, and playlist name |

---

## 3. Non-Goals

- No reverse geocoding
- No "nearest city" or region logic
- No persistence (no database, disk, or external cache)
- No user accounts or authentication
- No historical tracking (latest pin per device only)
- No private/hidden pins

---

## 4. Data Model

### In-Memory Store

```
Map<deviceId, PinRecord>
```

### PinRecord

| Field | Type | Description |
|-------|------|-------------|
| `deviceId` | `string` | Unique device identifier (UUID); primary key |
| `latitude` | `number` | Latitude (-90 to 90) |
| `longitude` | `number` | Longitude (-180 to 180) |
| `timestamp` | `string` | ISO-8601 timestamp; used for expiration |
| `playlistName` | `string` | Display name for the playlist |
| `payload` | `object` | Full original JSON payload (stored verbatim) |

---

## 5. Pin Expiration

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PIN_EXPIRATION_HOURS` | `24` | Hours until a pin expires |

### Rules

A pin is **expired** if:
```
pin.timestamp < now - PIN_EXPIRATION_HOURS
```

### Purging Strategy

- **Periodic purge:** Every 5 minutes, remove all expired pins
- **Opportunistic purge:** On read requests, filter out expired pins

Expired pins are never returned and are removed from memory.

---

## 6. API Endpoints

### 6.1 `POST /v1/pin` — Create/Update Pin

Stores or overwrites a pin for a device.

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

**Validation:**

| Field | Rule |
|-------|------|
| `deviceId` | Required, non-empty string |
| `latitude` | Required, number between -90 and 90 |
| `longitude` | Required, number between -180 and 180 |
| `timestamp` | Required, valid ISO-8601, not in future, not already expired |
| `playlistName` | Required, non-empty string |

**Behavior:**
- Upsert by `deviceId` (latest write wins)
- Store full payload verbatim

**Response:**
```json
{ "ok": true }
```

---

### 6.2 `GET /v1/pin/:deviceId` — Retrieve Pin

Returns the stored payload for a specific device.

**Responses:**
- `200` — Full stored payload
- `404` — Not found or expired

---

### 6.3 `GET /v1/pins` — Retrieve All Pins (Map Display)

Returns all non-expired pins for map visualization.

**Response:**
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

**Notes:**
- No city, region, or country fields are returned
- Only non-expired pins are included

---

### 6.4 `DELETE /v1/pin/:deviceId` — Delete Pin

Removes a pin by device ID.

**Responses:**
- `200` — `{ "success": true }`
- `404` — `{ "error": "Pin not found" }`

---

### 6.5 `POST /v1/radio` — Radio Heartbeat

Registers a listener by unique ad ID. The server tracks active listeners and automatically removes any that haven't sent a heartbeat within 5 minutes.

**Request Body:**
```json
{
  "id": "8A3F2B1C-4D5E-6F7A-8B9C-0D1E2F3A4B5C"
}
```

**Validation:**

| Field | Rule |
|-------|------|
| `id` | Required, non-empty string |

**Behavior:**
- Upsert by `id` — each heartbeat resets that ID's 5-minute expiration timer
- IDs with no heartbeat for 5 minutes are automatically removed

**Response:**
```json
{ "ok": true, "count": 7 }
```

| Field | Type | Description |
|-------|------|-------------|
| `ok` | `boolean` | Always `true` |
| `count` | `integer` | Current number of active listeners |

---

### 6.6 `GET /v1/radio` — Get Radio Listener Count

Returns the current number of active radio listeners.

**Response:**
```json
{ "count": 7 }
```

| Field | Type | Description |
|-------|------|-------------|
| `count` | `integer` | Number of unique IDs that have heartbeated within the last 5 minutes |

---

### 6.7 `GET /v1/alive` — Health Check

**Response:**
```json
{
  "alive": true,
  "pinsCount": 42,
  "expirationHours": 24,
  "now": "2026-01-27T19:00:00Z"
}
```

---

## 7. Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `3000` | Server port |
| `PIN_EXPIRATION_HOURS` | `24` | Hours until pin expiration |
| `RATE_LIMIT_PER_SECOND` | `100` | Global requests per second limit |
| `PIN_COUNT_WARNING_THRESHOLD` | `2000` | Log warning when pin count exceeds this |

---

## 8. Rate Limiting

- **Type:** Global (all requests combined)
- **Default:** 100 requests/second
- **Behavior:** Return `429 Too Many Requests` when exceeded

---

## 9. Error Handling

**Standard Error Format:**
```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "latitude must be between -90 and 90"
}
```

**Error Codes:**

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Pin not found or expired |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 10. Logging

- Log all endpoint hits with method, path, status, and duration
- Log pin data on POST (`PIN UPDATED: deviceId | playlist | coords | timestamp`)
- Log GET/DELETE results per handler
- Log memory status every 60 seconds (`[STATUS] pin count | playlist count | breakdown`)
- Log startup info (port, config values)
- Log warning when pin count exceeds threshold
- Log errors with stack traces

---

## 11. Deployment

- **Runtime:** Node.js (bare, no container)
- **Start command:** `npm start`
- **No persistence:** Service restart clears all pins

---

## 12. Acceptance Criteria

- [ ] Pins stored and retrieved by `deviceId`
- [ ] Latest pin overwrites previous for same device
- [ ] `POST /v1/pin` validates all required fields
- [ ] `POST /v1/pin` rejects invalid lat/lng ranges
- [ ] `POST /v1/pin` rejects future timestamps
- [ ] `POST /v1/pin` rejects already-expired timestamps
- [ ] `GET /v1/pins` returns all non-expired pins
- [ ] Expired pins are excluded from responses
- [ ] Expired pins are purged periodically (every 5 min)
- [ ] Global rate limiting returns 429 when exceeded
- [ ] Warning logged when pin count exceeds threshold
- [ ] `DELETE /v1/pin/:deviceId` removes pin and returns 200
- [ ] `DELETE /v1/pin/:deviceId` returns 404 if not found
- [ ] `POST /v1/radio` registers listener and returns count
- [ ] `GET /v1/radio` returns active listener count
- [ ] Radio listeners expire after 5 minutes of no heartbeat
- [ ] `GET /v1/alive` responds with health info
- [ ] Service restart clears all pins
- [ ] No city/region logic exists in backend

---

## 13. Out of Scope (Future Considerations)

- Authentication / API keys
- Persistent storage
- Historical pin tracking
- Web client support (CORS)
- Containerization (Docker)
- Automated testing
