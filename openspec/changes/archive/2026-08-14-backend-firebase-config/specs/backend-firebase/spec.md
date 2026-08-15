## ADDED Requirements

### Requirement: Firebase application SHALL initialize from environment-configured service account
The backend-firebase SHALL expose a global NestJS module (`FirebaseModule`) that initializes a `firebase-admin` application from a service account built out of the environment variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, and SHALL provide the initialized application under the `FIREBASE_APP` injection token. Initialization SHALL use `cert(...)` credentials and pass the explicit `projectId`. The module SHALL NOT crash when `firebase-admin` has already been initialized in the same process (it reuses the existing app via `getApp()`).

#### Scenario: Firebase app is initialized with cert and projectId
- **WHEN** the `FirebaseModule` is loaded with `FIREBASE_PROJECT_ID=riff-catalogo`, `FIREBASE_CLIENT_EMAIL=admin@riff.iam.gserviceaccount.com` and `FIREBASE_PRIVATE_KEY` set
- **THEN** `firebase-admin` `initializeApp` is called once with `credential` built from the service account and `projectId` equal to `riff-catalogo`
- **AND** the `FIREBASE_APP` token resolves to the initialized app instance

#### Scenario: Firebase app is reused when already initialized
- **WHEN** `firebase-admin` already has one app registered (via `getApps()` returning a non-empty array)
- **THEN** `initializeApp` is NOT called again
- **AND** the `FIREBASE_APP` token resolves to the existing app via `getApp()`

### Requirement: Firestore SHALL be provided via a dedicated injection token
The backend-firebase SHALL expose a global NestJS module (`FirestoreModule`) that provides the Firestore instance obtained from `getFirestore(app)` under the `FIRESTORE` injection token, so domain repositories can inject Firestore without importing `firebase-admin` directly.

#### Scenario: FIRESTORE token resolves to the Firestore instance
- **WHEN** the `FirestoreModule` is loaded with a valid `FIREBASE_APP` token
- **THEN** `getFirestore(app)` is called with the injected app
- **AND** the `FIRESTORE` token resolves to the returned Firestore instance

### Requirement: Service account configuration SHALL be built from pure, testable helpers
The backend-firebase SHALL include a `buildServiceAccountFromEnv` function that maps `{ projectId, clientEmail, privateKey }` inputs (each `string | undefined`) into a `ServiceAccount`, throwing a descriptive `Error` when any of `projectId`, `clientEmail`, or `privateKey` is missing. It SHALL also include a `normalizePrivateKey` function that converts escaped newline sequences (`\\n`) into real newlines (`\n`) and leaves already-normalized values untouched.

#### Scenario: Service account built from complete input
- **WHEN** `buildServiceAccountFromEnv` is called with all three values present
- **THEN** it returns an object with `projectId`, `clientEmail`, and `privateKey` equal to the inputs

#### Scenario: Service account throws when projectId is missing
- **WHEN** `buildServiceAccountFromEnv` is called with `projectId` undefined and the other two values present
- **THEN** it throws an `Error` whose message mentions `FIREBASE_PROJECT_ID`

#### Scenario: Service account throws when clientEmail is missing
- **WHEN** `buildServiceAccountFromEnv` is called with `clientEmail` undefined and the other two values present
- **THEN** it throws an `Error` whose message mentions `FIREBASE_CLIENT_EMAIL`

#### Scenario: Service account throws when privateKey is missing
- **WHEN** `buildServiceAccountFromEnv` is called with `privateKey` undefined and the other two values present
- **THEN** it throws an `Error` whose message mentions `FIREBASE_PRIVATE_KEY`

#### Scenario: Private key with escaped newlines is normalized
- **WHEN** `normalizePrivateKey` is called with a value containing `\\n` sequences
- **THEN** it returns the value with every `\\n` replaced by a real newline character

#### Scenario: Already-normalized private key is left untouched
- **WHEN** `normalizePrivateKey` is called with a value containing real newlines and no `\\n` sequences
- **THEN** it returns the input unchanged

### Requirement: Backend SHALL fail fast with a descriptive error when Firebase credentials are missing
The backend-firebase SHALL fail at startup with a descriptive error (rather than starting partially) when any of the required Firebase environment variables (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) is missing or empty.

#### Scenario: Startup fails when Firebase credentials are missing
- **WHEN** the `FirebaseModule` provider factory runs with an empty `FIREBASE_PROJECT_ID`
- **THEN** it throws an `Error` describing the missing `FIREBASE_PROJECT_ID`
- **AND** the NestJS application does not reach the listening state

### Requirement: Project environment files SHALL document the Firebase configuration
The backend-firebase SHALL align the root `.env.example` and the `apps/backend/.env.example` with the Riff stack, declaring `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`, and SHALL NOT declare the stale template variables for PostgreSQL, a self-managed `JWT_SECRET`, or AWS S3.

#### Scenario: Root env.example documents Firebase and drops stale variables
- **WHEN** the root `.env.example` is read
- **THEN** it contains `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
- **AND** it does NOT contain `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, nor `AWS_S3_BUCKET`

#### Scenario: Backend env.example documents Firebase variables
- **WHEN** the `apps/backend/.env.example` is read
- **THEN** it contains `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`
- **AND** it still contains `PORT=3000`

#### Scenario: Backend README documents Firebase setup steps
- **WHEN** the `apps/backend/README.md` is read
- **THEN** it documents the steps to create a Firebase project, enable Firestore, download a service account, and map its fields to the `FIREBASE_*` environment variables
- **AND** it warns not to commit the service account JSON
