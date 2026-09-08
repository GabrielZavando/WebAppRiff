## Why

La arquitectura de despliegue quedó aprobada (`decide-api-deployment-architecture`, 2026-09-08: Cloud Run para el API, Coolify para frontends, Firebase gestionado), pero no existe ninguna pieza ejecutable: faltan los Dockerfiles de `apps/web` y `apps/admin`, el workflow `deploy.yml` está roto (busca un Dockerfile en la raíz inexistente, nunca publica la imagen y no inyecta secretos), y el contrato de variables de entorno desincronizado puede publicar el sitio con catálogo vacío. Sin este change no hay despliegue posible.

## What Changes

- Crear `apps/web/Dockerfile` y `apps/admin/Dockerfile` multi-stage (contexto de build = raíz del monorepo, servidor estático ligero en runtime, healthcheck HTTP).
- Reemplazar `.github/workflows/deploy.yml` por un pipeline real con dos lanes:
  - **Backend**: build/push de la imagen a Artifact Registry (`southamerica-west1`) y deploy a Cloud Run `riff-api-staging` vía `gcloud run deploy`; promoción manual a `riff-api-prod` (trigger manual/tag `v*`).
  - **Frontends**: sin deploy por GitHub Actions — Coolify hace build in-situ desde Git (documentado en el workflow; opcionalmente trigger vía webhook `COOLIFY_WEBHOOK_URL`).
- Alinear el contrato de entorno:
  - `.env.example` sincronizado con el código (`SITE_URL`, `NESTJS_API_URL` con `/api/v1`, `CATEGORIES_WEBHOOK_URL`; eliminar `LOG_LEVEL`/`LOG_FORMAT` sin consumidores).
  - `apps/web/src/lib/api/*`: normalización de la base URL (garantizar sufijo `/api/v1`) y **fail-fast en builds de producción** cuando el API no responde (`REQUIRE_API=true`), eliminando el fallback silencioso a catálogo vacío en producción.

## Capabilities

### New Capabilities

- `frontend-dockerfiles`: imágenes Docker reproducibles para el sitio Astro y el panel Angular (multi-stage, contexto raíz del monorepo, servidor estático, healthcheck).
- `backend-cloudrun-pipeline`: pipeline CI/CD del backend NestJS hacia Cloud Run (build/push Artifact Registry, deploy staging, promoción manual a producción, rollback por revisión).
- `astro-env-contract`: contrato de variables de entorno del sitio Astro (URLs válidas por entorno) y política fail-fast del catálogo en builds productivos.

### Modified Capabilities

<!-- Ningún requisito de capacidades existentes cambia: los endpoints, el modelo de datos y la autenticación quedan intactos. -->

## Impact

- **Infraestructura**: `apps/web/Dockerfile` (nuevo), `apps/admin/Dockerfile` (nuevo), `.github/workflows/deploy.yml` (reemplazado).
- **Código web**: `apps/web/src/lib/api/{products,categories,subcategories}.ts` (normalización de base URL + fail-fast), `.env.example` (raíz).
- **CI/CD**: secrets/vars de GitHub Actions (`GCP_*`), identidad de despliegue de mínimo privilegio hacia GCP (WIF recomendado).
- **Sin cambios**: contratos REST `/api/v1`, modelo Firestore, autenticación, `apps/backend/Dockerfile` (se reutiliza tal cual), panel admin (código funcional no arrancó).
