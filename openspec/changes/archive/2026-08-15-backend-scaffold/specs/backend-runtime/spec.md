## ADDED Requirements

### Requirement: Backend application bootstrap SHALL start and listen on a configurable port
The backend-runtime SHALL expose a NestJS bootstrap function in `src/main.ts` that initializes the application, enables the NestJS runtime, and starts listening on the port provided by the `PORT` environment variable, defaulting to `3000` when the variable is unset or invalid. The port resolution SHALL live in a pure, testable function (`resolvePort`) so it can be covered by unit tests. The bootstrap SHALL log a single startup line with the active port using NestJS `Logger`. The application SHALL be constructed from `src/app.module.ts` (the root module).

#### Scenario: Backend starts on the default port when PORT env is unset
- **WHEN** the `PORT` environment variable is not set and `npm start` is executed in `apps/backend`
- **THEN** the process starts without crashing
- **AND** the application listens on port `3000`
- **AND** a startup log line containing the port `3000` is emitted

#### Scenario: Backend starts on a custom port when PORT env is provided
- **WHEN** the `PORT` environment variable is set to `4000` and `npm start` is executed in `apps/backend`
- **THEN** the process starts without crashing
- **AND** the application listens on port `4000`
- **AND** a startup log line containing the port `4000` is emitted

#### Scenario: Invalid PORT value falls back to the default port
- **WHEN** the `PORT` environment variable is set to a non-numeric string (e.g. `"abc"`)
- **THEN** `resolvePort` returns `3000`
- **AND** the application starts without crashing

#### Scenario: Explicit ephemeral port zero is respected
- **WHEN** the `PORT` environment variable is set to `"0"`
- **THEN** `resolvePort` returns `0`
- **AND** the application binds to an OS-assigned ephemeral port without falling back to `3000`

### Requirement: Health endpoint SHALL return ok status without authentication
The backend-runtime SHALL expose a `GET /health` endpoint at the application root (no `/api/v1` prefix in this change) that returns HTTP `200` with a JSON body `{ "status": "ok" }`, conforming to the contract in `docs/api-spec.yml` (`/health` is marked `security: []`). The endpoint SHALL be implemented in `src/app.controller.ts` and the status string SHALL be produced by `src/app.service.ts`. No request body, query parameters, or headers are required.

#### Scenario: GET /health returns 200 with ok status
- **WHEN** a `GET /health` request is made to the running application
- **THEN** the response status code is `200`
- **AND** the response `Content-Type` is `application/json`
- **AND** the response body equals `{ "status": "ok" }`

#### Scenario: Health endpoint does not require authentication
- **WHEN** a `GET /health` request is made with no `Authorization` header
- **THEN** the response status code is `200`
- **AND** the response body equals `{ "status": "ok" }`

### Requirement: TypeScript configuration SHALL enforce strict mode for the backend
The backend-runtime SHALL include a `tsconfig.json` in `apps/backend` with `strict: true`, `target: "ES2022"`, `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `outDir: "./dist"`, and path alias `@/*` mapped to `src/*`. A separate `tsconfig.build.json` SHALL extend `tsconfig.json` and exclude all `*.spec.ts` and `*.e2e-spec.ts` files so that `nest build` produces a production bundle without tests. The `npm run typecheck` script (`tsc --noEmit`) SHALL pass with exit code `0`.

#### Scenario: TypeScript strict typecheck passes
- **WHEN** `npm run typecheck` is executed in `apps/backend`
- **THEN** the command exits with code `0`
- **AND** no TypeScript diagnostics are emitted

#### Scenario: Build excludes test files from the production bundle
- **WHEN** `npm run build` is executed in `apps/backend`
- **THEN** the command exits with code `0`
- **AND** the file `dist/main.js` is produced
- **AND** no file matching `*.spec.js` or `*.e2e-spec.js` exists inside `dist/`

### Requirement: Backend SHALL pass ESLint with the SOLID thresholds from the standard
The backend-runtime SHALL include `.eslintrc.cjs` (adapted from `templates/ci/eslintrc.backend.js`) and `.dependency-cruiser.js` (copied from `templates/ci/.dependency-cruiser.js`). The lint configuration SHALL enforce `max-lines: ["error", 300]` and `complexity: ["error", 10]` on source files. The `npm run lint` script SHALL pass with exit code `0`.

#### Scenario: Lint passes with no violations
- **WHEN** `npm run lint` is executed in `apps/backend`
- **THEN** the command exits with code `0`
- **AND** no lint errors are reported

### Requirement: Backend unit tests SHALL pass with global coverage of at least 90 percent
The backend-runtime SHALL include a `jest.config.js` using the `ts-jest` preset with `coverageThreshold.global` set to at least `90` for statements, branches, functions, and lines. The `npm test` script SHALL pass with exit code `0` and the coverage report SHALL meet or exceed all four thresholds.

#### Scenario: Unit tests pass and coverage meets 90 percent threshold
- **WHEN** `npm test -- --coverage` is executed in `apps/backend`
- **THEN** the command exits with code `0`
- **AND** the reported coverage for statements is greater than or equal to `90`
- **AND** the reported coverage for branches is greater than or equal to `90`
- **AND** the reported coverage for functions is greater than or equal to `90`
- **AND** the reported coverage for lines is greater than or equal to `90`

### Requirement: AppController and AppService SHALL be covered by a unit test
The `AppController` method handling `GET /health` and the `AppService` method returning the status string SHALL each have a Jest unit test (`*.spec.ts`) verifying the returned value equals `"ok"` and the controller responds with `{ "status": "ok" }`. Both specs SHALL pass under `npm test`.

#### Scenario: AppService returns ok status string
- **WHEN** the `AppService.getStatus()` method is invoked
- **THEN** it returns the string `"ok"`

#### Scenario: AppController health endpoint returns the status envelope
- **WHEN** the `AppController.getHealth()` method is invoked
- **THEN** it returns an object equal to `{ "status": "ok" }`
- **AND** the returned value matches the body declared in `docs/api-spec.yml` for `/health`

### Requirement: Backend SHALL include a Dockerfile producing a runnable production image
The backend-runtime SHALL include a multi-stage `Dockerfile` in `apps/backend` whose final image is based on `node:22-slim`, exposes port `3000`, and runs `node dist/main.js` as the entrypoint. Building the Dockerfile with `docker build` SHALL succeed and produce an image that, when run, responds to `GET /health` with HTTP `200` and `{ "status": "ok" }`.

#### Scenario: Docker build succeeds and the image answers health check
- **WHEN** `docker build -t riff-backend-scaffold .` is executed in `apps/backend`
- **THEN** the build exits with code `0`
- **AND** running the resulting image and issuing `GET /health` to it returns HTTP `200` with body `{ "status": "ok" }`

### Requirement: Backend SHALL declare a sample environment file listing required variables
The backend-runtime SHALL include an `apps/backend/.env.example` listing the environment variables that the backend reads at startup in this change. The file SHALL contain at minimum `PORT=3000`. The `.gitignore` SHALL exclude `.env` from version control.

#### Scenario: env.example documents the PORT variable
- **WHEN** the file `apps/backend/.env.example` is read
- **THEN** it contains a line declaring `PORT=3000`
- **AND** the file `apps/backend/.gitignore` exists and contains a rule ignoring `.env`
