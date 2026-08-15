## ADDED Requirements

### Requirement: Backend SHALL provide an idempotent CLI command to bootstrap the first superadmin
The backend-usuarios SHALL provide a standalone NestJS entrypoint (`apps/backend/src/cli/bootstrap-superadmin.ts`), runnable via `npm run bootstrap:superadmin`, that creates the first `superadmin` user WITHOUT requiring an authenticated actor. It SHALL read `BOOTSTRAP_SUPERADMIN_EMAIL`, `BOOTSTRAP_SUPERADMIN_PASSWORD` (minimum 6 characters), and optionally `BOOTSTRAP_SUPERADMIN_NAME` from environment variables, validate them, and be idempotent: re-running MUST NOT create duplicates or error if a superadmin with that email already exists. It SHALL reuse `IUsuarioRepository.create` (which creates the Firebase Auth user, sets the `role` custom claim, and persists the `usuarios/{uid}` document). The `creadoPor` field SHALL be the constant `'system'`.

#### Scenario: Bootstrap creates the first superadmin when none exists
- **WHEN** the CLI runs with valid `BOOTSTRAP_SUPERADMIN_EMAIL` and `BOOTSTRAP_SUPERADMIN_PASSWORD` and zero users exist
- **THEN** a Firebase Auth user is created with that email and password
- **AND** `setCustomUserClaims(uid, { role: 'superadmin' })` is called
- **AND** a `usuarios/{uid}` document exists with `rol: 'superadmin'` and `creadoPor: 'system'`

#### Scenario: Re-running bootstrap is idempotent
- **WHEN** the CLI runs again with the same email
- **THEN** no new Firebase Auth user is created
- **AND** the existing superadmin is returned without error

#### Scenario: Missing required env vars fail fast
- **WHEN** the CLI runs without `BOOTSTRAP_SUPERADMIN_EMAIL` or `BOOTSTRAP_SUPERADMIN_PASSWORD`
- **THEN** it exits with a non-zero code and a descriptive error (no partial creation)

#### Scenario: Weak password is rejected
- **WHEN** `BOOTSTRAP_SUPERADMIN_PASSWORD` has fewer than 6 characters
- **THEN** the CLI exits with a descriptive error and creates nothing

### Requirement: Backend SHALL expose GET /auth/me returning the authenticated user's profile
The backend-usuarios SHALL expose `GET /api/v1/auth/me` protected only by `FirebaseAuthGuard` (any authenticated user, no role restriction), returning the `Usuario` profile loaded from the `usuarios/{uid}` Firestore document keyed by the verified token's `uid`. If no such document exists, it SHALL respond 404. The response SHALL be wrapped in the standard `{ data, error, meta }` envelope.

#### Scenario: Authenticated user retrieves own profile
- **WHEN** a request with a valid token hits `GET /api/v1/auth/me`
- **THEN** the response status is 200 with the `Usuario` (id, nombre, email, rol, activo, creadoPor, creadoEn, actualizadoEn)

#### Scenario: Missing or invalid token is rejected
- **WHEN** `GET /api/v1/auth/me` is requested without a valid bearer token
- **THEN** the response status is 401

#### Scenario: Authenticated user without Firestore document gets 404
- **WHEN** a valid token's `uid` has no `usuarios/{uid}` document
- **THEN** the response status is 404
