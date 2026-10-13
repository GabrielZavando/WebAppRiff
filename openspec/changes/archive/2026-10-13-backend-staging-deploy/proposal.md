# Proposal: backend-staging-deploy

## Why

El panel admin de staging está configurado contra el proyecto Firebase
`riff-catalogo-staging`, pero el backend desplegado en Cloud Run vive en el
proyecto de infraestructura `webappriff` (con `FIREBASE_PROJECT_ID=WebAppRiff`):
rechaza los tokens del admin (firma/audience no coinciden) y el superadmin
`soporte@gabrielzavando.cl` solo existe en `riff-catalogo-staging`. Esto bloquea
la verificación 7.5 del change archivado `deploy-docker-hardening` y deja a
staging sin API funcional. Se despliega una instancia del backend dentro de
`riff-catalogo-staging` para alinear identidad Firebase, datos y API en un solo
proyecto.

## What Changes

- Despliegue de una **nueva instancia del backend NestJS** en Cloud Run dentro
  del proyecto GCP/Firebase **`riff-catalogo-staging`** (región
  `southamerica-west1`), con su URL pública `*.run.app` propia.
- **Dockerfile ya existente** (`apps/backend/Dockerfile`, multi-stage): solo se
  documenta/construye la imagen; `resolvePort` ya lee el `PORT` que Cloud Run
  inyecta (8080). No se modifica el Dockerfile salvo que la verificación lo
  exija.
- **Runbook de despliegue** (`docs/deploy-standards.md` o runbook dedicado):
  comandos exactos y repetibles para construir la imagen, push a Artifact
  Registry y `gcloud run deploy`.
- **Configuración de runtime** de la nueva instancia: `NODE_ENV=production`,
  `FIREBASE_PROJECT_ID=riff-catalogo-staging`,
  `FIREBASE_STORAGE_BUCKET=riff-catalogo-staging.firebasestorage.app`, CORS
  allowlist (`ASTRO_SITE_URL=https://staging.somosriff.cl` y
  `ANGULAR_ADMIN_URL=https://admin-staging.somosriff.cl`), `RESEND_API_KEY` sin
  configurar (notifier cae a no-op con warning) y webhook de catálogo no-op
  (sin secretos; se activará en un change posterior junto al pipeline de
  rebuild del sitio).
- **Escalado a cero**: `--min-instances=0 --max-instances=2`, documentado.
- **Sin dominio propio**: se usa la URL `.run.app` que provee Google; el domain
  mapping queda para después.
- **Actualización de `docs/deploy-standards.md`**: reflejar la nueva topología
  de staging (servicio Cloud Run en `riff-catalogo-staging`), los prerrequisitos
  ops (IAM de la runtime SA dedicada) y la deuda de decomisión del servicio
  antiguo de `webappriff` (congelado, no borrado).
- **Desbloqueo de la tarea 7.5** de `deploy-docker-hardening` (archivado):
  verificación post-deploy (`/health` 200, `/auth/me` 401 sin token, login desde
  el admin de staging) y actualización de la nota de bloqueo.

Fuera de alcance: borrar o reconfigurar el servicio existente `riff-api-staging`
en `webappriff` (queda **congelado**; su baja queda documentada como deuda de
decomisión futura), reconfigurar la web Astro de staging hacia la nueva API
(solo se documenta como follow-up), activar el webhook de rebuild de catálogo
(change posterior con el pipeline de rebuild del sitio) y cualquier cambio de
código de backend/admin.

## Estado de implementación (2026-10-13)

- **Alcance backend: completado.** El servicio está desplegado y verificado en
  Cloud Run (`riff-catalogo-staging`):
  `https://riff-api-staging-345601325361.southamerica-west1.run.app` —
  `/health` con `status: ok` y `firebase: up`, `/api/v1/auth/me` responde 401
  sin token, y CORS acepta el origen `https://admin-staging.somosriff.cl`
  (evidencia en `verification.md`).
- **Cierre de 7.5 (verificación end-to-end admin ↔ backend): bloqueado por un
  bug del admin, fuera de alcance de este change.** El admin staging carga sin
  estilos: Tailwind CSS v4 en el build Docker no detecta los archivos fuente y
  emite ~11 KB de CSS sin utilidades (~49 KB en local). El fix se resolverá en
  el change `admin-tailwind-docker-fix`; cuando el admin funcione se ejecutará
  el login real y se cerrarán las tareas 6.1/6.2 de este change y la 7.5 de
  `deploy-docker-hardening`.

## Capabilities

### New Capabilities

Ninguna. Este change usa el schema `tech-housekeeping` (skip_specs): es una
tarea de infraestructura sin cambio de comportamiento observable del producto.
No se producen deltas de specs ni archivos bajo `specs/`; **no cambia ninguna
capability de producto**.

### Modified Capabilities

Ninguna.

## Impact

- **Infraestructura GCP**: nuevo servicio Cloud Run + repo de Artifact Registry
  + runtime SA dedicada (`riff-api-runtime@riff-catalogo-staging...`, roles
  `datastore.user` y `storage.objectAdmin`), todo en `riff-catalogo-staging`
  (billing ya habilitado, confirmado por el owner). Sin secretos en Secret
  Manager en esta ronda (webhook de catálogo no-op).
- **Repositorio**: documentación (`docs/deploy-standards.md`, runbook) y
  posible target de Makefile para construir la imagen del backend. Sin cambios
  de código TypeScript.
- **Despliegue**: la URL `*.run.app` de la nueva instancia alimenta la
  `API_BASE_URL` que Coolify usará para `riff-admin-staging` (paso manual en
  panel Coolify, documentado en el runbook).
- **Verificación**: smoke de API (`scripts/smoke/api.mjs` via `SMOKE_API_URL`)
  + verificación manual de login del admin; desbloquea 7.5 de
  `deploy-docker-hardening`.
