## MODIFIED Requirements

### Requirement: Health endpoint SHALL return ok status without authentication
The backend-runtime SHALL expose a `GET /health` endpoint at the application root (no `/api/v1` prefix) that returns HTTP `200` with a JSON body `{ "status": "ok", "version": <string>, "timestamp": <iso string>, "uptime": <number>, "firebase": "up" | "down" }`, conforming to the contract in `docs/api-spec.yml` (`/health` is marked `security: []`). The endpoint SHALL be implemented in `src/app.controller.ts`, the status string and enriched fields SHALL be produced by `src/app.service.ts`, and the `firebase` field SHALL reflect a best-effort Firestore connectivity check with a short timeout (the endpoint stays `200` even when `firebase` is `"down"`). No request body, query parameters, or headers are required.

#### Scenario: GET /health returns 200 with enriched ok status
- **WHEN** a `GET /health` request is made to the running application
- **THEN** the response status code is `200`
- **AND** the response `Content-Type` is `application/json`
- **AND** the response body contains `status` equal to `"ok"`
- **AND** the response body contains `version`, `timestamp`, `uptime`, and `firebase` (`"up"` or `"down"`)

#### Scenario: Health endpoint does not require authentication
- **WHEN** a `GET /health` request is made with no `Authorization` header
- **THEN** the response status code is `200`
- **AND** the response body contains `status` equal to `"ok"`
