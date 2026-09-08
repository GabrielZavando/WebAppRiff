# Deploy Standards

> Personalizado para Riff Catálogo Digital Headless. **Arquitectura aprobada el 2026-09-08** (change `decide-api-deployment-architecture`):
>
> - **Firebase (gestionado)**: Firestore, Firebase Authentication (incl. recuperación de contraseña) y Firebase Storage.
> - **API NestJS (BFF)**: **Google Cloud Run** — imagen de `apps/backend/Dockerfile` → Artifact Registry → `gcloud run deploy` desde GitHub Actions.
> - **Frontends**: sitio Astro y panel Angular como **servicios estáticos independientes en VPS con Coolify** (build in-situ desde Git en MVP).
>
> Definido (2026-09-08): **región GCP `southamerica-west1`**; dominios **`somosriff.cl`** (sitio Astro), **`admin.somosriff.cl`** (panel Angular) y **`api.somosriff.cl`** (API); proyecto Firebase de staging separado (**`riff-catalogo-staging`**).

## Environments

- `staging`: Cloud Run `riff-api-staging` (URL `*.run.app` provisional) + apps Coolify `web-staging` → `https://staging.somosriff.cl` y `admin-staging` → `https://admin-staging.somosriff.cl`. Proyecto Firebase separado: `riff-catalogo-staging`.
- `production`: Cloud Run `riff-api-prod` → `https://api.somosriff.cl` + apps Coolify de producción → `https://somosriff.cl` (Astro) y `https://admin.somosriff.cl` (Angular). Proyecto Firebase de producción: `riff-catalogo`.
- Promotion: manual, **aprobada por Gabriel**, tras smoke tests verdes en staging (prohibido promover con health checks o smoke en rojo).

## Pre-deploy Checklist

- All tests pass (backend + frontend)
- Lint and typecheck without errors
- Build succeeds (imagen backend + builds estáticos web/admin)
- No security vulnerabilities (`npm audit --audit-level=high`)

**Exit criteria:** every check passes. If any fails, fix it before proceeding.

## Versioning

- Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`
- `patch`: bug fixes → 1.0.0 → 1.0.1
- `minor`: backward-compatible features → 1.0.0 → 1.1.0
- `major`: breaking changes → 1.0.0 → 2.0.0
- The bump produces: git tag `vX.Y.Z`, commit `release: vX.Y.Z`, entry en `CHANGELOG.md` (Keep a Changelog), actualización de versión en `package.json` raíz y apps

## Build & Registry

| Servicio | Build | Registry | Notas |
|---|---|---|---|
| Backend (NestJS) | `apps/backend/Dockerfile` (multi-stage, contexto = raíz del monorepo) vía GitHub Actions | **Artifact Registry** (`REGION-docker.pkg.dev/PROJECT/riff/riff-backend`) | Tags: `vX.Y.Z` + `sha-<commit>`; `latest` prohibido en producción |
| Web (Astro) | `apps/web/Dockerfile` (pendiente de crear) vía Coolify | build in-situ (MVP); GHCR opcional | Servidor estático ligero (nginx/Caddy) |
| Admin (Angular) | `apps/admin/Dockerfile` (pendiente de crear) vía Coolify | build in-situ (MVP); GHCR opcional | Ídem |

## Deploy Flow

### Lane backend — Cloud Run

1. Merge a `main` (o tag `v*` para release).
2. GitHub Actions: build → push a Artifact Registry.
3. `gcloud run deploy riff-api-staging` (región GCP pendiente) con secretos desde Secret Manager.
4. Smoke tests de staging (ver sección siguiente).
5. Promoción **manual** a producción: deploy de la misma imagen taggeada en `riff-api-prod` + smoke tests de producción.

### Lane frontends — Coolify

1. Push a `main`.
2. Coolify build in-situ por app (`web`, `admin`) desde el repo.
3. Deploy a apps de staging; smoke tests.
4. Promoción manual a producción (redeploy con la misma referencia de build).

## Smoke Tests

- Health check: `GET /health` → 200 (backend)
- Key domain endpoints:
  - `GET /api/v1/products` (listado público)
  - `GET /api/v1/categories` (categorías)
  - `POST /api/v1/quotes` (captura cotización, público)
  - Frontend público: carga de home, ficha producto, listado categorías
  - Panel admin: login, listado productos, gestión usuarios
- Automated smoke tests per environment (script `npm run test:smoke` o equivalente en CI)

## Rollback

- **Backend**: rollback de revisión en Cloud Run (revert a la revisión anterior o `gcloud run services update-traffic` hacia el revision tag previo).
- **Frontends**: redeploy de la imagen/build anterior en Coolify.
- Verificar `/health` y endpoints clave después de cualquier rollback.

## Notifications

- Notify success/failure to team channel (Slack/Discord webhook — **pendiente: configurar webhook**)
- Create a GitHub Release with generated notes (automático via `deploy` skill + `gh release create`)

## Environment Variables

| Variable | Dónde vive | Description | Example |
|----------|------------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Cloud Run (Secret Manager) | Project ID de Firebase para el Admin SDK | `riff-catalogo` |
| `FIREBASE_CLIENT_EMAIL` | Cloud Run (Secret Manager) | Service account email | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Cloud Run (Secret Manager) | Service account private key | `-----BEGIN PRIVATE KEY-----...` |
| `NESTJS_API_URL` | Build de Astro (y runtime de admin) | Base URL del API. **Contrato: debe incluir `/api/v1`** (los clientes construyen `${base}/products`, etc.) | `https://api.somosriff.cl/api/v1` |
| `SITE_URL` | Build de Astro | URL pública del sitio (canonical, sitemap) — **no debe quedar en `localhost` en producción** | `https://somosriff.cl` |
| `API_URL` | Runtime de Angular admin | Base URL del API para el panel (definir forma exacta en el ticket del admin) | `https://api.somosriff.cl/api/v1` |
| `ASTRO_SITE_URL` | Cloud Run (backend) | Origen del sitio Astro para la allowlist CORS en producción | `https://somosriff.cl` |
| `ANGULAR_ADMIN_URL` | Cloud Run (backend) | Origen del admin para la allowlist CORS en producción | `https://admin.somosriff.cl` |
| `GCP_REGION` | GitHub Actions / gcloud | Región de Artifact Registry y Cloud Run — **aprobada: `southamerica-west1`** | `southamerica-west1` |
| `GCP_PROJECT` | GitHub Actions / gcloud | Project ID de GCP para registry y Cloud Run | `riff-catalogo` |
| `COOLIFY_API_TOKEN` | Coolify (si se usa API) | Token para Coolify CLI/API | `coolify_xxx` |
| `SLACK_WEBHOOK` | GitHub Actions | Notification webhook | `https://hooks.slack.com/...` |

**Reglas de secretos**:

- Credenciales Firebase Admin **solo** en el runtime del backend (Secret Manager → montadas como env vars de Cloud Run).
- Prohibidas en bundles frontend, argumentos de build Docker, `.env` versionado o variables `PUBLIC_*` de Astro.
- La identidad de GitHub Actions para GCP debe ser de mínimo privilegio (Workload Identity Federation recomendado, sin JSON keys de service account).

## Estado del workflow actual (`.github/workflows/deploy.yml`)

El workflow vigente está **obsoleto y debe reemplazarse** (no parchearse): busca un `Dockerfile` en la raíz (el real está en `apps/backend/Dockerfile`), construye sin publicar a registry, hace `docker pull` en el VPS de una imagen nunca pusheada, no inyecta secretos y su rollback referencia un tag `:previous` inexistente. Su reemplazo (lane Cloud Run + lane Coolify, según `Deploy Flow`) se implementará en un change posterior de CI/CD.

## Project-specific stack

```
Runtime: Node.js 22 (alineado a engines del monorepo; corregir CI que usa node 24)
Backend runtime: Google Cloud Run (escala a cero; revisar min-instances tras medir cold starts)
Frontends: contenedores estáticos en VPS + Coolify (nginx/Caddy)
Registry backend: Artifact Registry (build por GitHub Actions)
Registry frontends: build in-situ Coolify (MVP); GHCR opcional
Smoke tests: npm run test:smoke (backend), npm run test:smoke (web), npm run test:smoke (admin)
Rollback: Cloud Run revisión anterior / Coolify redeploy anterior
VPS Provider: pendiente de confirmación (tentativo: Oracle Cloud VPS existente)
Región GCP: southamerica-west1 (aprobada) · Dominios: somosriff.cl / admin.somosriff.cl / api.somosriff.cl (aprobados) · Firebase staging: riff-catalogo-staging (separado)
```
