PRD: Pins Backend Service (Node.js, In-Memory)

1. Purpose
   This service collects lightweight location “pins” from client devices and exposes them for:
   Per-device retrieval
   Global map visualization
   Health checks
   The service is intentionally stateless beyond memory, schema-agnostic, and location-primitive only (latitude/longitude).
2. Design Principles
   Coordinates are canonical
   Latitude/longitude are the only authoritative location data.
   No place-name inference
   The backend does not determine cities, regions, or human-readable locations.
   Client-derived presentation
   Any city/region labels are derived client-side (e.g., iOS reverse geocoding).
   Ephemeral data
   Pins automatically expire and are purged.
3. Non-Goals
   No reverse geocoding
   No “nearest city” or region logic
   No persistence (DB, disk, cache)
   No user accounts or authentication
   No historical tracking (latest pin only)
4. Data Model
   In-Memory Store
   Map<deviceId, PinRecord>
   PinRecord
   Field Type Notes
   deviceId string Unique identifier; primary key
   payload object Full JSON payload (stored verbatim)
   latitude number Promoted for fast access
   longitude number Promoted for fast access
   timestamp string (ISO-8601) Used for expiration
   playlistName string | null Used for map display
   playlistRef object Community vs private
5. Pin Expiration
   Configuration
   PIN_EXPIRATION_HOURS (env var)
   Default: 24
   Rule
   A pin is expired if:
   pin.timestamp < now - PIN_EXPIRATION_HOURS
   Purging
   Periodic purge (recommended: every 5 minutes)
   Opportunistic purge on read requests
   Expired pins:
   Are not returned
   Are removed from memory
6. API
   6.1 POST /v1/pin — postPin
   Stores or overwrites a pin for a device.
   Request Body
   Accepts either:
   Community pin (playlist shared)
   Private pin (no sharing)
   Validation (minimal):
   deviceId (required)
   latitude, longitude (required)
   timestamp (valid ISO-8601)
   playlistRef.community or playlistRef.private
   Behavior:
   Upsert by deviceId
   Latest write wins
   Store full payload verbatim
   Response
   { "ok": true }
   6.2 GET /v1/pin/:deviceId — retrievePin
   Returns the entire stored JSON payload for the device.
   200 → full payload
   404 → not found or expired
   6.3 GET /v1/users — retrieveUsers
   Returns all non-expired pins in a reduced format for map display.
   Response
   {
   "pins": [
   {
   "deviceId": "8A3F2B1C-4D5E-6F7A-8B9C-0D1E2F3A4B5C",
   "latitude": 40.71,
   "longitude": -74.01,
   "playlistRef": { "community": { "communityId": "comm_midnight_drift" } },
   "timestamp": "2026-01-27T18:30:00Z",
   "playlistName": "Midnight Drift"
   }
   ]
   }
   Notes
   deviceId replaces legacy pin\_\* IDs
   Private pins:
   Included by default
   playlistName: null
   No city, region, or country fields are returned
   6.4 GET /v1/alive — alive
   Health / uptime endpoint.
   { "alive": true }
   Optional additions:
   pinsCount
   expirationHours
   now
7. Location Semantics (Important)
   Backend Responsibility
   Store and return raw coordinates only
   Treat coordinates as opaque values
   Never infer place names
   Client Responsibility (iOS)
   If a city or region label is needed:
   Use iOS Core Location reverse geocoding
   Treat results as best-effort presentation
   City names must not be sent to or stored by this service
   Rationale
   Reverse geocoding is:
   network-backed
   rate-limited
   platform-specific
   Coordinates remain consistent and privacy-preserving
8. Error Handling
   Standard error format:
   {
   "errorCode": "VALIDATION_ERROR",
   "message": "timestamp must be a valid ISO-8601 string"
   }
   Codes:
   VALIDATION_ERROR (400)
   NOT_FOUND (404)
   INTERNAL_ERROR (500)
9. Acceptance Criteria
   ✅ Pins stored by deviceId
   ✅ Latest pin overwrites previous
   ✅ /users returns reduced payload with deviceId
   ✅ Expired pins are excluded and purged
   ✅ No city / region logic exists in backend
   ✅ Service restart clears all pins
   ✅ /alive responds reliably
