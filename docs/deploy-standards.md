# Deploy Standards

> Personalizado para Riff Catálogo Digital Headless. **Proveedor VPS pendiente de decisión** (opción tentativa: Oracle Cloud VPS existente con Coolify).

## Environments

- `staging`: pre-production testing environment (despliegue en VPS staging vía Coolify)
- `production`: final environment, only after staging smoke tests pass (despliegue en VPS production vía Coolify)
- Promotion: manual via Coolify UI o CLI tras confirmación de staging verde

## Pre-deploy Checklist

- All tests pass (backend + frontend)
- Lint and typecheck without errors
- Build succeeds (Docker images para backend, web, admin)
- No security vulnerabilities (`npm audit --audit-level=high`)

**Exit criteria:** every check passes. If any fails, fix it before proceeding.

## Versioning

- Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`
- `patch`: bug fixes → 1.0.0 → 1.0.1
- `minor`: backward-compatible features → 1.0.0 → 1.1.0
- `major`: breaking changes → 1.0.0 → 2.0.0
- The bump produces: git tag `vX.Y.Z`, commit `release: vX.Y.Z`, entry en `CHANGELOG.md` (Keep a Changelog), actualización de versión en `package.json` raíz y apps

## Build & Registry

- Build multi-stage Dockerfile por cada app (backend, web, admin) tagged con la versión
- **Registry**: Pendiente de decisión — opciones: GHCR (GitHub Container Registry), Docker Hub, o build local en VPS vía Coolify (sin registry externo obligatorio en MVP)
- Coolify puede hacer build in-situ desde el repo Git (preferido para simplicidad MVP)

## Deploy Flow

1. Push tag/commit a rama `main` (o trigger manual en Coolify)
2. Coolify detecta cambios y builda imágenes Docker (o pull si usa registry)
3. Deploy a `staging` (entorno aislado en mismo VPS o VPS separado)
4. Wait ~30s y run smoke tests (health check + endpoints clave del catálogo/cotizaciones)
5. If smoke tests fail → Rollback inmediato en Coolify (redeploy imagen anterior)
6. Deploy a `production` solo tras staging verde (promoción manual en Coolify)
7. Run production smoke tests

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

- Coolify: redeploy de la imagen/tag anterior (1 click en UI o CLI)
- Verificar health después de rollback
- No hay Kubernetes: rollback es a nivel contenedor Docker vía Coolify

## Notifications

- Notify success/failure to team channel (Slack/Discord webhook — **pendiente: configurar webhook**)
- Create a GitHub Release with generated notes (automático via `deploy` skill + `gh release create`)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCKER_REGISTRY` | Container registry URL (opcional si build local) | `ghcr.io/org` |
| `COOLIFY_API_TOKEN` | Token para Coolify CLI/API | `coolify_xxx` |
| `SLACK_WEBHOOK` | Notification webhook | `https://hooks.slack.com/...` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `riff-catalogo` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk@...` |
| `FIREBASE_PRIVATE_KEY` | Service account private key | `-----BEGIN PRIVATE KEY-----...` |
| `NESTJS_API_URL` | URL pública del backend | `https://api.riff.cl/v1` |
| `ASTRO_SITE_URL` | URL pública del sitio Astro | `https://catalogo.riff.cl` |
| `ANGULAR_ADMIN_URL` | URL pública del panel admin | `https://admin.riff.cl` |

## Project-specific stack

```
Runtime: Node.js 20
Container: Docker (multi-stage)
Orchestration: Coolify en VPS auto-gestionado (sin Kubernetes)
Registry: Pendiente — GHCR / Docker Hub / build local Coolify
Smoke tests: npm run test:smoke (backend), npm run test:smoke (web), npm run test:smoke (admin)
Rollback: Coolify redeploy imagen anterior
VPS Provider: **PENDIENTE DE DECISIÓN** (tentativo: Oracle Cloud VPS existente)
```
