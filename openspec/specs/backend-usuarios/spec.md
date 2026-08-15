# backend-usuarios Specification

## Purpose
TBD - created by archiving change backend-usuarios. Update Purpose after archive.
## Requirements
### Requirement: Backend SHALL authenticate requests by verifying Firebase ID tokens
The backend-usuarios SHALL provide a `FirebaseAuthGuard` that, for any route decorated to require authentication, reads the `Authorization: Bearer <token>` header, verifies the token via Firebase Admin SDK `getAuth().verifyIdToken(token)`, and populates `request.user` with the decoded token (including the `role` custom claim). If the header is missing or the token is invalid/expired, the guard SHALL reject the request with HTTP 401. Routes without the auth guard applied SHALL remain accessible without a token.

#### Scenario: Valid token allows the request and populates the user
- **WHEN** a protected route is requested with a valid Firebase ID token
- **THEN** the request proceeds
- **AND** `request.user` contains the decoded token claims including `role`

#### Scenario: Missing or invalid token is rejected with 401
- **WHEN** a protected route is requested without a bearer token or with an invalid/expired token
- **THEN** the response status is 401

#### Scenario: Public routes are unaffected by the auth guard
- **WHEN** a route without the auth guard is requested without a token
- **THEN** the response is served normally (e.g. 200)

### Requirement: Backend SHALL enforce role-based authorization via custom claims
The backend-usuarios SHALL provide a `@Roles(...)` decorator and a `RolesGuard` that reads the `role` custom claim from `request.user` (set by the auth guard) and allows the request only if `request.user.role` is among the declared roles; otherwise it responds 403. The auth guard MUST execute before the roles guard.

#### Scenario: Superadmin accesses a superadmin-restricted route
- **WHEN** a request with a valid token whose `role` is `superadmin` hits a route requiring `@Roles('superadmin')`
- **THEN** the request proceeds

#### Scenario: Editor is denied a superadmin-only route
- **WHEN** a request with `role: editor` hits a route requiring `@Roles('superadmin')`
- **THEN** the response status is 403

#### Scenario: Request without role claim is denied
- **WHEN** a request with a valid token but no `role` claim hits a route requiring any `@Roles(...)`
- **THEN** the response status is 403

### Requirement: Backend SHALL synchronize the role custom claim with Firestore on user create/update
The backend-usuarios SHALL, when a user is created, create the Firebase Auth user (email + initial password), set the `role` custom claim via `setCustomUserClaims(uid, { role })`, and persist a `usuarios` document (id = UID) with the entity fields. When a user's role is updated, it SHALL also update the custom claim.

#### Scenario: Creating a user sets the custom claim and persists the document
- **WHEN** a user is created with `rol: editor`
- **THEN** a Firebase Auth user is created with UID X
- **AND** `setCustomUserClaims(X, { role: 'editor' })` is called
- **AND** a `usuarios/X` document exists with `rol: editor`

#### Scenario: Updating a user's role updates the custom claim
- **WHEN** an existing user's `rol` is changed to `admin`
- **THEN** `setCustomUserClaims(uid, { role: 'admin' })` is called
- **AND** the `usuarios/{uid}` document reflects `rol: admin`

### Requirement: Backend SHALL expose role-gated /users management endpoints
The backend-usuarios SHALL implement `GET /users`, `POST /users`, `GET /users/{id}`, `PUT /users/{id}`, `PATCH /users/{id}` from `docs/api-spec.yml`. Access control follows `docs/data-model.md`:
- Listing and reading users requires `superadmin` OR `admin`.
- Creating a user: `rol=superadmin` or `rol=admin` → only `superadmin`; `rol=editor` → `superadmin` OR `admin`.
- Updating a user: changing `rol` to `superadmin`/`admin` → only `superadmin`; deactivating (`activo=false`) → an `admin` cannot deactivate themselves nor another `admin`; `superadmin` can.
- The system SHALL never be left without at least one active `superadmin`.

#### Scenario: Admin lists users
- **WHEN** an authenticated `admin` requests `GET /users`
- **THEN** the response is 200 with the users array

#### Scenario: Editor is denied listing users
- **WHEN** an authenticated `editor` requests `GET /users`
- **THEN** the response status is 403

#### Scenario: Admin creates an editor
- **WHEN** an `admin` creates a user with `rol: editor`
- **THEN** the response is 201 and the user is created

#### Scenario: Admin cannot create an admin
- **WHEN** an `admin` creates a user with `rol: admin`
- **THEN** the response status is 403

#### Scenario: Superadmin can create an admin
- **WHEN** a `superadmin` creates a user with `rol: admin`
- **THEN** the response is 201

#### Scenario: Admin cannot deactivate another admin
- **WHEN** an `admin` deactivates (`activo=false`) another `admin`
- **THEN** the response status is 403

#### Scenario: Superadmin deactivates an admin
- **WHEN** a `superadmin` deactivates another `admin`
- **THEN** the response is 200 and the user is inactive

#### Scenario: System keeps at least one active superadmin
- **WHEN** an update would deactivate or demote the last active `superadmin`
- **THEN** the response status is 409 (conflict)

