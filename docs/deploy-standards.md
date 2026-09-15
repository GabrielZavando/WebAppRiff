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
| Backend (NestJS) | `apps/backend/Dockerfile` (multi-stage, contexto = raíz del monorepo) vía GitHub Actions | **Artifact Registry** (`REGION-docker.pkg.dev/PROJECT/riff/riff-backend`) | Tag `sha-<commit>` (el tag git `vX.Y.Z` marca el release); `latest` prohibido; la promoción despliega el **digest** validado en staging |
| Web (Astro) | `apps/web/Dockerfile` (multi-stage → nginx, build args `SITE_URL`/`NESTJS_API_URL`/`REQUIRE_API`) vía Coolify | build in-situ (MVP); GHCR opcional | Healthcheck incluido en la imagen |
| Admin (Angular) | `apps/admin/Dockerfile` (multi-stage → nginx, SPA fallback) vía Coolify | build in-situ (MVP); GHCR opcional | Healthcheck incluido en la imagen |

## Deploy Flow

### Lane backend — Cloud Run

1. Merge a `main` (trigger staging tras CI en verde; el release se dispara por `workflow_dispatch` manual).
2. GitHub Actions: build → push a Artifact Registry.
3. `gcloud run deploy riff-api-staging` (región `southamerica-west1`) con secretos desde Secret Manager.
4. Smoke tests de staging (ver sección siguiente).
5. Promoción a producción: `workflow_dispatch` manual → el workflow re-verifica el smoke de staging, resuelve el **digest** del tag `sha-<commit>` ya validado y lo despliega a `riff-api-prod` + smoke de producción. *(Nota: `workflow_run` solo se dispara cuando CI corre (push a main/PRs), no en pushes de tag; la promoción a producción se hace por dispatch manual.)*

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

> **Quién autoriza la promoción a producción**: **Gabriel** (aprobación manual). No se promociona a producción con health checks o smoke en rojo.

### Identificar la última revisión sana

- Listar revisiones de un servicio Cloud Run y ver su estado/tráfico:
  ```bash
  gcloud run revisions list --service riff-api-prod --region southamerica-west1 \
    --project riff-catalogo --format yaml --limit 5
  ```
- La **última sana** es la revisión más reciente que pasó el smoke completo (API
  `/health` + products/categories/subcategories). En el historial de deploys de
  GitHub o en los estados del pipeline se identifica el último `deploy` en verde.
- Anotar el nombre exacto de esa revisión (formato `riff-api-prod-<hash>`).

### Backend — revertir revisión en Cloud Run

- Dirigir el 100 % del tráfico a la revisión sana conocida:
  ```bash
  gcloud run services update-traffic riff-api-prod \
    --to-revisions=<REVISION_SANA>=100 \
    --region southamerica-west1 --project riff-catalogo
  ```
- O, si solo se conoce "la anterior", revertir a la revisión previa por nombre.
- La URL del servicio no cambia (mismo domain mapping/URL `*.run.app`).

### Frontends — redesplegar el commit previo en Coolify

- Desde el panel Coolify, en cada recurso afectado (web/admin, staging o prod):
  1. Rebuild **deploy** con la referencia del commit/etiqueta anterior
     (redeploy del build previo) — Coolify permite "redeploy" de la imagen/build
     anterior.
  2. El build in-situ usa la misma referencia git del commit que se quiere
     restaurar.
- Verificar que el redeploy termina en verde en Coolify antes de continuar.

### Smoke tras el rollback

- API: `npm run smoke:api` contra la URL del servicio (`SMOKE_API_URL`).
- Astro: `npm run smoke:web` (`SMOKE_WEB_URL`).
- Angular: `npm run smoke:admin` (`SMOKE_ADMIN_URL`).
- Confirmar `/health` y los endpoints clave (`/api/v1/products`, categories,
  subcategories) y las páginas públicas del frontend.

## URLs provisionales → definitivas

> Hasta que existan los dominios definitivos (`somosriff.cl`, `admin.somosriff.cl`,
> `staging.somosriff.cl`, `admin-staging.somosriff.cl`, `api.somosriff.cl`), los
> ambientes se sirven con URLs **temporales**: Cloud Run `*.run.app` para la API, y
> dominios wildcard de Coolify (p. ej. `*.sslip.io`) para web/admin. Al existir el
> DNS, aplicar este checklist de migración:

1. **DNS**: crear los registros A/CNAME para los dominios definitivos hacia el VPS
   de Coolify (web/admin) y el domain mapping de `api.somosriff.cl` → Cloud Run.
2. **Coolify Build Variables** (web staging/prod): actualizar `SITE_URL` y
   `NESTJS_API_URL` a las URLs definitivas (p. ej. `https://somosriff.cl` y
   `https://api.somosriff.cl/api/v1`). Redeploy de web y admin.
3. **Coolify dominios**: asignar los dominios definitivos a los 4 recursos
   (reemplazando las URLs wildcard temporales); Coolify emite TLS vía Let's
   Encrypt.
4. **Cloud Run CORS**: actualizar `ASTRO_SITE_URL` y `ANGULAR_ADMIN_URL` en los
   servicios Cloud Run para incluir los orígenes definitivos (`https://somosriff.cl`
   y `https://admin.somosriff.cl`).
5. **Domain mapping de la API**: crear el mapping `api.somosriff.cl` → `riff-api-prod`.
6. **Smoke**: re-ejecutar `smoke:api`, `smoke:web`, `smoke:admin` contra las URLs
   definitivas.

## Notifications

- Notify success/failure to team channel (Slack/Discord webhook — **pendiente: configurar webhook**)
- Create a GitHub Release with generated notes (automático via `deploy` skill + `gh release create`)

## Environment Variables

| Variable | Dónde vive | Description | Example |
|----------|------------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Cloud Run (variable de entorno, no secreto de clave privada) | Project ID de Firebase para el Admin SDK | `riff-catalogo` |
| `FIREBASE_STORAGE_BUCKET` | Cloud Run (variable de entorno, no secreto de clave privada) | Bucket por defecto de Firebase Storage para el Admin SDK (requerido en runtime) | `webappriff.firebasestorage.app` |
| `FIREBASE_CLIENT_EMAIL` | **Solo CLI raw `migrate:firestore`** (fuera de NestJS) | Service account email — no se usa en runtime ni en CLIs NestJS | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | **Solo CLI raw `migrate:firestore`** (fuera de NestJS) | Service account private key — no se usa en runtime ni en CLIs NestJS | `-----BEGIN PRIVATE KEY-----...` |
| `NESTJS_API_URL` | Build de Astro (y runtime de admin) | Base URL del API. **Contrato: debe incluir `/api/v1`** (los clientes construyen `${base}/products`, etc.) | `https://api.somosriff.cl/api/v1` |
| `SITE_URL` | Build de Astro | URL pública del sitio (canonical, sitemap) — **no debe quedar en `localhost` en producción** | `https://somosriff.cl` |
| `API_URL` | Runtime de Angular admin | Base URL del API para el panel (definir forma exacta en el ticket del admin) | `https://api.somosriff.cl/api/v1` |
| `ASTRO_SITE_URL` | Cloud Run (backend) | Origen del sitio Astro para la allowlist CORS en producción | `https://somosriff.cl` |
| `ANGULAR_ADMIN_URL` | Cloud Run (backend) | Origen del admin para la allowlist CORS en producción | `https://admin.somosriff.cl` |
| `GCP_REGION` | GitHub Actions / gcloud | Región de Artifact Registry y Cloud Run — **aprobada: `southamerica-west1`** | `southamerica-west1` |
| `GCP_PROJECT` | GitHub Actions / gcloud | Project ID de GCP para registry y Cloud Run | `riff-catalogo` |
| `COOLIFY_API_TOKEN` | Coolify (si se usa API) | Token para Coolify CLI/API | `coolify_xxx` |
| `SLACK_WEBHOOK` | GitHub Actions | Notification webhook | `https://hooks.slack.com/...` |
| `CATALOG_REBUILD_WEBHOOK_URL` | Cloud Run (backend — **secreto NestJS en Secret Manager**, ops-managed) | URL del webhook que el backend dispara cuando cambia cualquier entidad pública del catálogo (categoría, subcategoría, producto) para que Coolify regenere el sitio Astro. `POST` fire-and-forget con `Authorization: Bearer <token>` y timeout de 5s. No-op si no está configurado | `https://coolify.example.com/deploy` |
| `CATALOG_REBUILD_WEBHOOK_TOKEN` | Cloud Run (backend — **secreto NestJS en Secret Manager**, ops-managed) | Token Bearer con el que se autentica el rebuild webhook del catálogo. **Nunca se loguea ni se envía en el body**. Reemplaza a la antigua variable de webhook de categorías (sin auth) | `secret-token` |
| `SMOKE_API_URL` | GitHub Actions (post-deploy smoke) | URL base de la API para el smoke test post-deploy (`/health`, products, categories, subcategories). No-op si no está | `https://<run>.run.app` |
| `SMOKE_WEB_URL` | GitHub Actions (post-deploy smoke) | URL del sitio Astro para `smoke:web`. No-op si no está | `https://staging.somosriff.cl` |
| `SMOKE_ADMIN_URL` | GitHub Actions (post-deploy smoke) | URL del panel Angular para `smoke:admin`. No-op si no está | `https://admin.somosriff.cl` |

**Reglas de secretos**:

- El runtime de Cloud Run autentica contra Firebase Admin mediante **Application Default Credentials (ADC)**: usa la service account de runtime del servicio (`riff-api-runtime`, vía Workload Identity) **sin JSON keys ni secretos de clave privada**.
- Los CLIs de NestJS que reusan `FirebaseModule` (seed, migrate-imagenes, bootstrap, normalize-descriptions) autentican **también con ADC** igual que el runtime (en local: `gcloud auth application-default login` o `GOOGLE_APPLICATION_CREDENTIALS`).
- `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` son credenciales del service account **solo para el CLI raw `migrate:firestore`** (conecta origen/destino con un SA JSON explícito) y **no se montan en Cloud Run**.
- Prohibidas en bundles frontend, argumentos de build Docker, `.env` versionado o variables `PUBLIC_*` de Astro.
- La identidad de GitHub Actions para GCP debe ser de mínimo privilegio (Workload Identity Federation recomendado, sin JSON keys de service account).

## Pipeline (`.github/workflows/deploy.yml`)

Reemplaza al workflow legacy de SSH/docker (eliminado con este change). Estructura:

- **Gating por CI (AC2)**: `deploy.yml` es un `workflow_run` sobre el workflow
  `CI` (`types: completed`). Solo procede si `conclusion == 'success'` para el
  mismo commit; si CI falla, no se despliega nada. `workflow_dispatch` es la
  excepción manual explícita (vía de producción). Los PRs no activan deploy; CI
  (typecheck/build/test/audit/docker) protege PRs.
- **`docker-build`**: build sin push de las 3 imágenes. La imagen de validación
  de Astro se construye con `--build-arg REQUIRE_API=false` (el runner no tiene
  API viva); los builds reales de Coolify mantienen `REQUIRE_API=true` via sus
  Build Variables, así un deploy real falla si la API está caída o el catálogo
  viene vacío (AC4).
- **`deploy-backend-staging`** (CI success en `main`): push del backend a
  Artifact Registry (`sha-<commit>`) → `riff-api-staging` → smoke `/health` (URL
  derivada con `gcloud run services describe`).
- **`deploy-frontends-staging`**: dispara los frontends de staging (web y admin)
  tras el smoke de Cloud Run, vía `COOLIFY_WEB_STAGING_WEBHOOK_URL` y
  `COOLIFY_ADMIN_STAGING_WEBHOOK_URL`, con
  `curl --fail --silent --show-error --request GET "$URL" -H "Authorization: Bearer $COOLIFY_API_TOKEN"`.
  No-op con aviso si los secrets no están configurados (AC3/AC6/AC7).
- **`deploy-backend-production`** (manual dispatch): resuelve el digest del
  `sha-<commit>` validado en staging, re-ejecuta el smoke de staging como gate,
  despliega a `riff-api-prod` y fuma producción. Nunca `latest`, nunca build
  fresco (AC8).
- **`deploy-frontends-production`**: tras el deploy de producción, dispara los
  frontends de producción (web y admin) vía `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL`
  y `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL` con el mismo patrón Bearer (AC6/AC7).
- **Secrets Coolify** (creados como ops): `COOLIFY_API_TOKEN` +
  `COOLIFY_WEB_STAGING_WEBHOOK_URL` + `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` +
  `COOLIFY_WEB_PRODUCTION_WEBHOOK_URL` + `COOLIFY_ADMIN_PRODUCTION_WEBHOOK_URL`.
- Los jobs GCP quedan **gateados por `vars.GCP_PROJECT`** hasta configurar los
  recursos cloud (así main permanece verde antes del primer deploy real).
- Autenticación GCP: **Workload Identity Federation** (sin JSON keys), mínimo
  privilegio.
- Rollback: `gcloud run services update-traffic riff-api-prod --to-revisions <previous>=100` (ver `Rollback`).

## Project-specific stack

```
Runtime: Node.js 24 (alineado a engines del monorepo)
Backend runtime: Google Cloud Run (escala a cero; revisar min-instances tras medir cold starts)
Frontends: contenedores estáticos en VPS + Coolify (nginx)
Registry backend: Artifact Registry (build por GitHub Actions, deploy.yml)
Registry frontends: build in-situ Coolify (MVP); GHCR opcional
Pipeline: deploy.yml — docker-build en PRs, staging en main, producción por tag v*/dispatch (gated por vars.GCP_PROJECT)
Smoke tests: npm run test:smoke (backend), npm run test:smoke (web), npm run test:smoke (admin)
Rollback: Cloud Run revisión anterior / Coolify redeploy anterior
VPS Provider: pendiente de confirmación (tentativo: Oracle Cloud VPS existente)
Región GCP: southamerica-west1 (aprobada) · Dominios: somosriff.cl / admin.somosriff.cl / api.somosriff.cl (aprobados) · Firebase staging: riff-catalogo-staging (separado)
```
