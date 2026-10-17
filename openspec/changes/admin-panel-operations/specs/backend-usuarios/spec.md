# Delta backend-usuarios

## Purpose
Flujo de invitación para el alta de usuarios desde el panel: la creación vía `POST /users` no requiere password (el usuario lo define desde el email de restablecimiento de Firebase que dispara el panel) y el listado `GET /users` se enriquece con un estado derivado `invitado|activo` leído de la metadata de Firebase Auth (`lastSignInTime`), sin persistirlo en Firestore. Las reglas de roles (quién crea a quién, cambio de rol, desactivación, último superadmin activo) no cambian.

## MODIFIED Requirements

### Requirement: Backend SHALL synchronize the role custom claim with Firestore on user create/update
The backend-usuarios SHALL, when a user is created, create the Firebase Auth user (email — without a password when created through the panel invitation flow), set the `role` custom claim via `setCustomUserClaims(uid, { role })`, and persist a `usuarios` document (id = UID) with the entity fields. When a user's role is updated, it SHALL also update the custom claim.

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
The backend-usuarios SHALL implement `GET /users`, `POST /users`, `GET /users/{id}`, `PUT /users/{id}`, `PATCH /users/{id}` from `docs/api/api-spec.yml`. Access control follows `docs/data-model/data-model.md`:
- Listing and reading users requires `superadmin` OR `admin`.
- Creating a user: `rol=superadmin` or `rol=admin` → only `superadmin`; `rol=editor` → `superadmin` OR `admin`.
- Creating a user SHALL NOT require a password: users created through the panel invitation flow are created in Firebase Auth without one; the user defines the password later via the Firebase password reset email (triggered by the admin panel with the Firebase client SDK).
- Updating a user: changing `rol` to `superadmin`/`admin` → only `superadmin`; deactivating (`activo=false`) → an `admin` cannot deactivate themselves nor another `admin`; `superadmin` can.
- Listing users SHALL enrich each entry with a derived `estado` — `invitado` when the Firebase Auth user has never signed in (`lastSignInTime` null), `activo` otherwise — read from Firebase Auth metadata and NOT persisted in Firestore. When a user's password is defined and they sign in for the first time, the listing SHALL report `activo` without any write from this change.
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

#### Scenario: User created via the invitation flow has no password and starts as invitado
- **WHEN** a user is created without a password
- **THEN** the Firebase Auth user exists with no password and `lastSignInTime` is null
- **AND** `GET /users` reports `estado: 'invitado'` for that user

#### Scenario: Listing derives the state from Firebase Auth metadata
- **GIVEN** a user who has signed in at least once
- **WHEN** `GET /users` is requested
- **THEN** the entry reports `estado: 'activo'` (derived from `lastSignInTime`)
- **AND** no `estado` field is persisted in the Firestore document

#### Scenario: Admin cannot deactivate another admin
- **WHEN** an `admin` deactivates (`activo=false`) another `admin`
- **THEN** the response status is 403

#### Scenario: Superadmin deactivates an admin
- **WHEN** a `superadmin` deactivates another `admin`
- **THEN** the response is 200 and the user is inactive

#### Scenario: System keeps at least one active superadmin
- **WHEN** an update would deactivate or demote the last active `superadmin`
- **THEN** the response status is 409 (conflict)
