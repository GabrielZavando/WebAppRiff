# Delta frontend-dockerfiles

## Purpose
Endurecimiento de la instalación de dependencias en el Dockerfile del admin: el build de Coolify del 2026-10-15 falló por un `ECONNRESET` transitorio en el `npm ci` de `apps/admin/Dockerfile:51`. Se añaden retries de npm y un bucle de reintento alrededor del `npm ci`, sin cambiar ningún otro comportamiento de la imagen (SPA fallback, sin secretos, runtime sin Node.js).

## MODIFIED Requirements

### Requirement: The Angular admin app SHALL have a reproducible multi-stage Docker image

The repository SHALL provide `apps/admin/Dockerfile` that builds the Angular app with the monorepo root as build context and serves it from a lightweight static HTTP server with SPA fallback routing, without Node.js in the runtime stage and without secrets. The dependency installation step (`npm ci --workspace=@riff/admin`) SHALL be resilient to transient registry failures: npm SHALL be configured with fetch retries (`fetch-retries 5`, `fetch-retry-mintimeout 20000`, `fetch-retry-maxtimeout 120000`, `fetch-timeout 600000`) and the `npm ci` command SHALL be wrapped in a retry loop of up to 5 attempts with a 15-second delay between attempts. No other `RUN` step of the image SHALL be modified by this resilience behavior.

#### Scenario: Local build succeeds from the monorepo root

- **WHEN** `docker build -f apps/admin/Dockerfile .` is executed from the repository root
- **THEN** the build completes and produces a working image with the compiled admin bundle

#### Scenario: SPA routes resolve in the runtime image

- **WHEN** a client requests a deep route (e.g. `/login`) from the running image
- **THEN** the server returns the index HTML (SPA fallback) with status 200

#### Scenario: Transient registry failure does not break the build

- **WHEN** `npm ci --workspace=@riff/admin` fails with a transient network error (e.g. `ECONNRESET`) on a non-final attempt
- **THEN** the build waits 15 seconds and retries the installation (up to 5 attempts in total)
- **AND** the build succeeds when a retry completes

#### Scenario: Persistent registry failure still fails the build

- **WHEN** all 5 installation attempts fail
- **THEN** the Docker build fails with a visible error and does not produce an image
