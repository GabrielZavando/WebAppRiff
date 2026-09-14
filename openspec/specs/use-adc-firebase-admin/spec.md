# use-adc-firebase-admin Specification

## Purpose
TBD - created by archiving change use-adc-firebase-admin. Update Purpose after archive.
## Requirements
### Requirement: FIREBASE_APP SHALL initialize with Application Default Credentials
The provider `FIREBASE_APP` in `apps/backend/src/infrastructure/firebase/firebase.module.ts` SHALL, when no Firebase app is initialized yet (`getApps().length === 0`), call `initializeApp` with `credential: applicationDefault()`, `projectId` from `ConfigService.getOrThrow('FIREBASE_PROJECT_ID')` and `storageBucket` from `ConfigService.getOrThrow('FIREBASE_STORAGE_BUCKET')`. It SHALL NOT read `FIREBASE_CLIENT_EMAIL` nor `FIREBASE_PRIVATE_KEY` to init the runtime app.

#### Scenario: Initializes with ADC and required config when no app exists
- **WHEN** NestJS resolves `FIREBASE_APP` in a process with `getApps()` empty
- **AND** `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET` are set
- **THEN** `initializeApp` is called once with `credential: applicationDefault()`, `projectId` equal to `FIREBASE_PROJECT_ID` and `storageBucket` equal to `FIREBASE_STORAGE_BUCKET`
- **AND** neither `FIREBASE_CLIENT_EMAIL` nor `FIREBASE_PRIVATE_KEY` are required

#### Scenario: Reuses the existing singleton app
- **WHEN** `getApps()` already returns an initialized app (hot-reload, multiple testing modules)
- **THEN** `FIREBASE_APP` resolves to `getApp()` without calling `initializeApp` again

#### Scenario: Fails fast when FIREBASE_PROJECT_ID is missing
- **WHEN** `FIREBASE_PROJECT_ID` is not set and no app exists
- **THEN** the boot fails with a descriptive error mentioning `FIREBASE_PROJECT_ID` (via `ConfigService.getOrThrow`)

#### Scenario: Fails fast when FIREBASE_STORAGE_BUCKET is missing
- **WHEN** `FIREBASE_PROJECT_ID` is set but `FIREBASE_STORAGE_BUCKET` is not, and no app exists
- **THEN** the boot fails with a descriptive error mentioning `FIREBASE_STORAGE_BUCKET`

### Requirement: Local CLI tools SHALL keep their explicit service account auth
The backend CLI commands that run outside Cloud Run (`migrate:firestore`, `migrate:productos:imagenes`, `bootstrap:superadmin`, seeds) SHALL keep authenticating with an explicit service account via `cert()` and the `normalizePrivateKey()` helper from `firebase.config.ts`, which must remain available. `buildServiceAccountFromEnv` may be removed only once confirmed to have no remaining runtime consumers.

#### Scenario: Migration CLI still authenticates with an explicit SA
- **WHEN** running a migration CLI locally with a service account JSON
- **THEN** it authenticates with `cert()` using `normalizePrivateKey()` from `firebase.config.ts`, unchanged

### Requirement: Environment contract SHALL reflect AD-only runtime
The `.env.example` files (repo root and `apps/backend/.env.example`) SHALL document that the runtime requires only `FIREBASE_PROJECT_ID` and `FIREBASE_STORAGE_BUCKET`, that `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` are for local CLIs only, and that local runtime development uses `gcloud auth application-default login` or `GOOGLE_APPLICATION_CREDENTIALS`. `docs/deploy-standards.md` SHALL reflect that Cloud Run authenticates via the runtime service account and does not mount private-key secrets.

#### Scenario: Developer onboarding sees the new contract
- **WHEN** a developer reads `.env.example` (root and backend) and the env table in `docs/deploy-standards.md`
- **THEN** they find that runtime uses ADC with `FIREBASE_PROJECT_ID` + `FIREBASE_STORAGE_BUCKET`
- **AND** that `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` are documented as local-CLI-only
- **AND** that local runtime setup uses `gcloud auth application-default login`

### Requirement: Test suite SHALL pass without real Firebase credentials
The backend suite (`lint`, `typecheck`, `test`, `test:cov` at ≥ 90 %, `test:e2e`) SHALL pass in CI without real credentials. The `FirebaseModule` specs SHALL be updated to mock `applicationDefault()` and assert the new initialization contract.

#### Scenario: CI is green without credentials
- **WHEN** the full backend suite runs in CI with no real Firebase credentials
- **THEN** all checks pass, including the updated `firebase.module.spec.ts` mocking `applicationDefault()`

