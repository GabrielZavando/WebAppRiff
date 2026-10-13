# Tasks: backend-staging-deploy

> Las tareas marcadas **(operador)** se ejecutan fuera del repo (GCP/Coolify)
> siguiendo el runbook; las demás son trabajo en el repo (apply).

## 1. Runbook y documentación (repo)

- [x] 1.1 Crear `docs/runbooks/backend-staging-cloud-run.md` (español): prerrequisitos ops (billing ya habilitado; APIs; runtime SA con comandos exactos: `gcloud iam service-accounts create riff-api-runtime --project=riff-catalogo-staging` + dos `gcloud projects add-iam-policy-binding` con `roles/datastore.user` y `roles/storage.objectAdmin`; repo AR), comandos exactos y repetibles de build/push (tag `sha-<commit>`, contexto raíz del monorepo), `gcloud run deploy` con las env vars y flags del design (`--allow-unauthenticated`, `--min-instances=0`, `--max-instances=2`, `--service-account=riff-api-runtime@riff-catalogo-staging.iam.gserviceaccount.com`), smoke post-deploy y rollback (delete del servicio / update-traffic)
- [x] 1.2 Añadir target `docker-build-backend` al Makefile (paridad con `docker-build`: `docker build -f apps/backend/Dockerfile -t riff-backend:ci .` desde la raíz)
- [x] 1.3 Actualizar `docs/deploy-standards.md`: topología de staging (servicio Cloud Run `riff-api-staging` en proyecto `riff-catalogo-staging`; el homónimo de `webappriff` queda congelado y documentado como deuda de decomisión futura), escalado min=0/max=2, URL `*.run.app` provisional, webhook de catálogo no-op en staging (se activará con el pipeline de rebuild del sitio, change posterior) y enlace al runbook

## 2. Prerrequisitos GCP (operador, según runbook)

- [x] 2.1 Habilitar APIs `run.googleapis.com` + `artifactregistry.googleapis.com` en `riff-catalogo-staging` (billing ya habilitado, confirmado por el owner)
- [x] 2.2 Crear la runtime SA dedicada `riff-api-runtime@riff-catalogo-staging.iam.gserviceaccount.com` (`gcloud iam service-accounts create riff-api-runtime`) y otorgar exactamente dos roles vía `gcloud projects add-iam-policy-binding`: `roles/datastore.user` y `roles/storage.objectAdmin`
- [x] 2.3 Crear el repo de Artifact Registry `riff` en `riff-catalogo-staging` (`gcloud artifacts repositories create riff`)

## 3. Build y despliegue (operador, según runbook)

- [x] 3.1 Construir la imagen del backend (`docker build -f apps/backend/Dockerfile`) y pushearla con tag `sha-<commit>` a `<REGION>-docker.pkg.dev/riff-catalogo-staging/riff/riff-backend`
- [x] 3.2 Desplegar con `gcloud run deploy riff-api-staging --project riff-catalogo-staging --region southamerica-west1` (env vars: `NODE_ENV=production`, `FIREBASE_PROJECT_ID=riff-catalogo-staging`, `FIREBASE_STORAGE_BUCKET=riff-catalogo-staging.firebasestorage.app`, `ASTRO_SITE_URL=https://staging.somosriff.cl`, `ANGULAR_ADMIN_URL=https://admin-staging.somosriff.cl`; sin `RESEND_API_KEY`; sin secretos — webhook de catálogo no-op; flags del design) y anotar la URL `*.run.app` resultante (`https://riff-api-staging-345601325361.southamerica-west1.run.app`)

## 4. Smoke del backend

- [x] 4.1 `SMOKE_API_URL=<URL> npm run smoke:api` en verde (`/health` con `firebase: up` + products/categories/subcategories con arreglo `data`)
- [x] 4.2 `curl -i <URL>/api/v1/auth/me` sin token → HTTP 401

## 5. Coolify y verificación del admin (operador)

- [x] 5.1 En el panel Coolify, configurar en `riff-admin-staging` la Build Variable `API_BASE_URL` (`<URL>.run.app/api/v1`) y las Build Variables Firebase del proyecto staging si faltan (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`); redeploy del admin
- [ ] 5.2 Login desde el panel admin de staging con `soporte@gabrielzavando.cl` y carga del perfil (`/auth/me` → 200 con datos del usuario) — **BLOQUEADA**: requiere el admin funcional (bug CSS en build Docker; ver nota en 6.x y change `admin-tailwind-docker-fix`)

## 6. Cierre y desbloqueo 7.5

- [ ] 6.1 Verificar login del admin staging contra el backend real (BLOQUEADA)
- [ ] 6.2 Cerrar la tarea 7.5 del change archivado deploy-docker-hardening (BLOQUEADA)

> **Bloqueadas por bug del admin (fuera de alcance de este change)**
>
> El backend de staging está operativo y verificado:
> - URL: https://riff-api-staging-345601325361.southamerica-west1.run.app
> - /health: status ok, firebase up.
> - /api/v1/auth/me: 401 sin token (FirebaseAuthGuard funcionando).
> - CORS hacia https://admin-staging.somosriff.cl: OK.
>
> El admin staging no puede autenticarse todavía porque su CSS no se
> genera correctamente en el build Docker (Tailwind v4 no encuentra los
> archivos fuente, CSS resultante de ~11 KB en lugar de ~49 KB, sin
> utilidades). Sin CSS el login no es usable.
>
> Se resolverá en el change `admin-tailwind-docker-fix`. Cuando el admin
> funcione, se ejecutará el login real y se cerrarán 6.1/6.2 + la tarea
> 7.5 del change archivado deploy-docker-hardening.
