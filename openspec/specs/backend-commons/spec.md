# backend-commons Specification

## Purpose
TBD - created by archiving change backend-commons. Update Purpose after archive.
## Requirements
### Requirement: Backend SHALL enable CORS restricted to configured frontend origins
The backend-commons SHALL enable CORS via `app.enableCors(...)` using options produced by a pure `buildCorsOptions(config)` function. In production (`NODE_ENV !== 'development'`) the allowed origin list SHALL be the strictly filtered set of `ASTRO_SITE_URL` and `ANGULAR_ADMIN_URL` that are present (fail-closed: if both are empty, no origins are allowed). In development (`NODE_ENV === 'development'`) the origin SHALL be `true` (allow all) to ease local development. `credentials` SHALL be `true` and `methods` restricted to safe HTTP methods.

#### Scenario: Production restricts CORS to the configured frontend origins
- **WHEN** `buildCorsOptions` is called with `NODE_ENV=production`, `ASTRO_SITE_URL=https://catalogo.riff.cl` and `ANGULAR_ADMIN_URL=https://admin.riff.cl`
- **THEN** the returned options have `origin` equal to `["https://catalogo.riff.cl", "https://admin.riff.cl"]`
- **AND** `credentials` is `true`

#### Scenario: Development allows all origins
- **WHEN** `buildCorsOptions` is called with `NODE_ENV=development`
- **THEN** the returned options have `origin` equal to `true`

#### Scenario: Production with missing origins fails closed
- **WHEN** `buildCorsOptions` is called with `NODE_ENV=production` and both `ASTRO_SITE_URL` and `ANGULAR_ADMIN_URL` empty/undefined
- **THEN** the returned options have `origin` equal to an empty array

### Requirement: Backend SHALL apply a global request validation pipe
The backend-commons SHALL register a global `ValidationPipe` configured from a pure `buildValidationOptions()` function with `whitelist: true`, `transform: true`, and `forbidNonWhitelisted: true`, so that all incoming DTOs are validated and stripped of unknown properties before reaching handlers.

#### Scenario: Validation options enforce whitelist and transform
- **WHEN** `buildValidationOptions` is called
- **THEN** the result has `whitelist` equal to `true`
- **AND** `transform` equal to `true`
- **AND** `forbidNonWhitelisted` equal to `true`

#### Scenario: Global ValidationPipe is registered on the app
- **WHEN** the application bootstrap runs in `main.ts`
- **THEN** `useGlobalPipes` is invoked with a `ValidationPipe` built from the validation options

### Requirement: Backend SHALL rate-limit public endpoints via Throttler
The backend-commons SHALL register `ThrottlerModule.forRootAsync` with options from a pure `buildThrottlerOptions(config)` function (reading `THROTTLE_TTL` and `THROTTLE_LIMIT` with sensible defaults) and SHALL set a `ThrottlerGuard` as the global `APP_GUARD`. The guard SHALL skip rate limiting for the `/health` route so health probes are never throttled.

#### Scenario: Throttler options derive from environment with defaults
- **WHEN** `buildThrottlerOptions` is called with `THROTTLE_TTL=60` and `THROTTLE_LIMIT=100`
- **THEN** the result encodes a ttl of `60` and a limit of `100`

#### Scenario: Throttler applies default limits when env is unset
- **WHEN** `buildThrottlerOptions` is called with both `THROTTLE_TTL` and `THROTTLE_LIMIT` undefined
- **THEN** the result encodes a positive default ttl and limit

#### Scenario: Health route is excluded from throttling
- **WHEN** the `HealthAwareThrottlerGuard` processes a request whose URL is `/health`
- **THEN** it skips rate limiting (the request is allowed regardless of limits)

### Requirement: API responses SHALL be wrapped in a consistent envelope
The backend-commons SHALL provide a `ResponseInterceptor` (`APP_INTERCEPTOR`) that wraps successful JSON responses from routes under the `/api/v1/` prefix into `{ data, error: null, meta }`, where `meta` contains at least `timestamp` and `path`. Routes outside the `/api/v1/` prefix (e.g. `/health`) SHALL pass through unchanged.

#### Scenario: API v1 response is wrapped in the envelope
- **WHEN** a successful response is returned from a route whose URL starts with `/api/v1/`
- **THEN** the response body equals `{ data: <original body>, error: null, meta: { timestamp: <iso>, path: <url> } }`

#### Scenario: Non-API route response is not wrapped
- **WHEN** a successful response is returned from a route whose URL does not start with `/api/v1/` (e.g. `/health`)
- **THEN** the response body is returned unchanged (no envelope)

### Requirement: Errors SHALL be returned in a consistent envelope
The backend-commons SHALL provide a global `HttpExceptionFilter` (`APP_FILTER`) that maps any thrown exception into `{ data: null, error: { statusCode, message, error }, meta: { timestamp, path } }`. For `HttpException` the `statusCode`, `message` and error name SHALL be taken from the exception; for unexpected errors a `500` with message `Internal server error` SHALL be returned (without leaking stack traces in production).

#### Scenario: HttpException is normalized to the error envelope
- **WHEN** a handler throws an `HttpException` with status `404` and message `"Not found"`
- **THEN** the response status is `404`
- **AND** the response body equals `{ data: null, error: { statusCode: 404, message: "Not found", error: "Not Found" }, meta: { timestamp: <iso>, path: <url> } }`

#### Scenario: Unexpected error is normalized to 500
- **WHEN** a handler throws a non-`HttpException` error
- **THEN** the response status is `500`
- **AND** the response body has `error.message` equal to `"Internal server error"`

### Requirement: Health endpoint SHALL report enriched status
The backend-commons SHALL extend `GET /health` so it returns `200` with an object `{ status, version, timestamp, uptime, firebase }`, where `status` is `"ok"`, `version` is the app version, `timestamp` is an ISO string, `uptime` is the process uptime in seconds, and `firebase` is `"up"` when a best-effort Firestore connectivity check succeeds within a short timeout or `"down"` otherwise. The endpoint SHALL remain `200` even when `firebase` is `"down"`.

#### Scenario: Health returns enriched status with firebase up
- **WHEN** `GET /health` is called and the Firestore connectivity check succeeds
- **THEN** the response status is `200`
- **AND** the body contains `status` equal to `"ok"`
- **AND** the body contains `version`, `timestamp`, `uptime`, and `firebase` equal to `"up"`

#### Scenario: Health remains 200 when Firebase is unreachable
- **WHEN** `GET /health` is called and the Firestore connectivity check fails or times out
- **THEN** the response status is still `200`
- **AND** the body contains `firebase` equal to `"down"`
- **AND** the body contains `status` equal to `"ok"`

