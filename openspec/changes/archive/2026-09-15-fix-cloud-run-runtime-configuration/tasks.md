# Tasks — fix-cloud-run-runtime-configuration

> Capas: CI/CD (`.github/workflows/deploy.yml`) + docs (`docs/deploy-standards.md`).
> No hay capas de aplicación (no cambia código NestJS). `.specboot.json`
> `services: ["."]`.

## Task 1 — Configurar el deploy-cloudrun de staging (runtime SA + env + secrets + ingress)

**Prioridad**: Alta · **Capa**: CI/CD · **Estimación**: M

- [x] En `deploy-backend-staging`, ampliar el step "Deploy to Cloud Run (staging)" del
  action `deploy-cloudrun@v2` para incluir:
  - `service: ${{ vars.CLOUD_RUN_SERVICE }}`
  - `image:` usando `vars.GCP_ARTIFACT_REPOSITORY` (ruta completa
    `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${GCP_ARTIFACT_REPOSITORY}/riff-backend:sha-...`)
  - `env_vars:` con `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`,
    `NODE_ENV=production`, `ASTRO_SITE_URL` (= `SMOKE_WEB_STAGING_URL`),
    `ANGULAR_ADMIN_URL` (= `SMOKE_ADMIN_STAGING_URL`)
  - `secrets:` con `CATALOG_REBUILD_WEBHOOK_URL=CATALOG_REBUILD_WEBHOOK_URL:latest`
    y `CATALOG_REBUILD_WEBHOOK_TOKEN=CATALOG_REBUILD_WEBHOOK_TOKEN:latest`
  - `flags:` con `--service-account=${{ vars.GCP_RUNTIME_SA }}` y
    `--allow-unauthenticated`
- [x] No definir `PORT`.
- [x] Ajustar los `gcloud run services describe riff-api-staging` del smoke y del
  rollback-hint para usar `vars.CLOUD_RUN_SERVICE`.

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica (validación YAML + `openspec validate`)

## Task 2 — Parametrizar rutas de imagen/servicio en staging

**Prioridad**: Media · **Capa**: CI/CD · **Estimación**: S

- [x] Reemplazar el literal `riff/riff-backend` (build-push tags y `deploy-cloudrun`
  image) por `${vars.GCP_ARTIFACT_REPOSITORY}/riff-backend`.
- [x] Reemplazar el literal de servicio `riff-api-staging` por `vars.CLOUD_RUN_SERVICE`
  en los puntos de staging (deploy, smoke, rollback hint).

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica

## Task 3 — Bloquear la lane de producción hasta tener repo vars propias

**Prioridad**: Alta · **Capa**: CI/CD · **Estimación**: M

- [x] Introducir repo vars de producción **nuevas y vacías**: `CLOUD_RUN_SERVICE_PRODUCTION`,
  `FIREBASE_PROJECT_ID_PRODUCTION`, `FIREBASE_STORAGE_BUCKET_PRODUCTION`,
  `SMOKE_WEB_PRODUCTION_URL`, `SMOKE_ADMIN_PRODUCTION_URL` (y
  `GCP_RUNTIME_SA_PRODUCTION` si aplica).
- [x] Gatear `deploy-backend-production` con
  `vars.CLOUD_RUN_SERVICE_PRODUCTION != '' && vars.FIREBASE_PROJECT_ID_PRODUCTION != ''`
  (además del actual `vars.GCP_PROJECT != ''`).
- [x] Gatear `deploy-frontends-production` con la misma condición (o depender de
  `deploy-backend-production` que ya queda no-op).
- [x] Asegurar que staging NO usa las vars de producción (aislamiento).

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica

## Task 4 — Documentar la configuración y las acciones humanas pendientes en GCP

**Prioridad**: Media · **Capa**: docs · **Estimación**: M

- [x] `docs/deploy-standards.md`: nueva sección "Acciones humanas pendientes antes
  del primer deploy" con:
  - Secretos a crear en Secret Manager (`CATALOG_REBUILD_WEBHOOK_URL`,
    `CATALOG_REBUILD_WEBHOOK_TOKEN`, versión `latest`).
  - IAM del runtime SA `riff-api-runtime@webappriff.iam.gserviceaccount.com`:
    `roles/secretmanager.secretAccessor` (en webappriff), `roles/datastore.user` +
    roles de Storage sobre `riff-catalogo-staging`, e `iam.serviceAccountUser` del
    deploy SA → runtime SA.
  - Nota de acceso cross-project entre `webappriff` (infra) y
    `riff-catalogo-staging` (Firebase).
  - Datos mínimos de Firestore staging (seed de catálogo) para que el smoke de
    catálogo no vacío pase.
- [x] Tabla de env: reflejar las env vars ahora consumidas en staging y las nuevas
  vars de producción (vacías).

**Suggested Path**: `docs/deploy-standards.md`
**Test Path**: no aplica

## Task 5 — Verificación del change

**Prioridad**: Alta · **Capa**: transversal · **Estimación**: S

- [x] `openspec validate fix-cloud-run-runtime-configuration` → válido.
- [x] `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))"` → OK.
- [x] `bash check-refs.sh` y `bash specboot.sh --ci` → 0 errores.
- [x] Builds Docker de las 3 imágenes (backend, web con `REQUIRE_API=false`, admin)
  → en verde.
- [x] Confirmar por lectura que producción queda no-op con vars vacías y que no se
  hardcodea `riff/riff-backend` ni `riff-api-staging` en staging.

**Suggested Path**: no aplica (transversal)
**Test Path**: no aplica

## Mandatory Steps

> Checklist obligatoria inyectada desde `docs/openspec-tasks-mandatory-steps.md`
> (fuente única de verdad) en el momento de generación del `tasks.md`.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).