# Scenarios — fix-cloud-run-runtime-configuration

> Validación de diseño: verifica el comportamiento del pipeline de deploy (CI/CD)
> y la configuración de runtime de Cloud Run. Aplica los valores reales de repo
> vars confirmados por el operador (GCP_PROJECT=webappriff, proyecto Firebase
> staging=riff-catalogo-staging, etc.).

### SC-001: El deploy puede crear el servicio Cloud Run desde cero
**Given** el servicio `riff-api-staging` no existe todavía en Cloud Run
**When** el lane de staging se ejecuta (CI success en main)
**Then** `deploy-cloudrun` crea el servicio (en lugar de fallar porque no existe)
**And** el nombre del servicio se toma de `vars.CLOUD_RUN_SERVICE`

### SC-002: Cloud Run usa la service account de runtime configurada
**Given** el lane de staging despliega el backend
**When** `deploy-cloudrun` crea/actualiza el servicio
**Then** el servicio usa la service account `GCP_RUNTIME_SA` (vía flag
`--service-account`)
**And** no se usan claves JSON ni service accounts por defecto

### SC-003: El contenedor arranca con ADC sin credenciales JSON
**Given** el contenedor se despliega en Cloud Run con el runtime SA correcto
**When** NestJS arranca e inicializa `FirebaseModule`
**Then** usa `applicationDefault()` (ADC) y solo necesita `FIREBASE_PROJECT_ID` y
`FIREBASE_STORAGE_BUCKET`
**And** no se inyecta `FIREBASE_CLIENT_EMAIL` ni `FIREBASE_PRIVATE_KEY`

### SC-004: Las env vars de Firebase y CORS se entregan al runtime
**Given** el deploy-cloudrun de staging
**When** se crea el servicio
**Then** se configuran `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`,
`NODE_ENV=production`, `ASTRO_SITE_URL` (de `SMOKE_WEB_STAGING_URL`) y
`ANGULAR_ADMIN_URL` (de `SMOKE_ADMIN_STAGING_URL`)
**And** no se define `PORT` manualmente (Cloud Run lo inyecta y `resolvePort` lo respeta)

### SC-005: Acceso público al staging (allow-unauthenticated)
**Given** el servicio de staging desplegado
**Then** el deploy pasa `--allow-unauthenticated`
**And** `/health`, productos, categorías y subcategorías son accesibles para los
smoke tests y los frontends

### SC-006: Los secretos del webhook de catálogo vienen de Secret Manager
**Given** los secrets `CATALOG_REBUILD_WEBHOOK_URL` y `CATALOG_REBUILD_WEBHOOK_TOKEN`
existen en Secret Manager (proyecto `webappriff`)
**When** se despliega el backend
**Then** se inyectan en Cloud Run vía el input `secrets` del action (no escritos en
el workflow ni en logs)
**And** si el secret falta, el deploy del action falla con error claro (no silencioso)

### SC-007: La ruta de imágenes usa las repo vars en vez de literales
**Given** el lane de staging
**When** se construye/pushea la imagen del backend
**Then** la ruta usa `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${GCP_ARTIFACT_REPOSITORY}/riff-backend:sha-<commit>`
**And** no se hardcodea `riff/riff-backend` ni el nombre de servicio en múltiples sitios

### SC-008: Staging nunca reutiliza valores de producción
**Given** el lane de staging
**When** despliega
**Then** solo usa `vars` con prefijo explicito de staging (SMOKE_WEB_STAGING_URL,
SMOKE_ADMIN_STAGING_URL) y el runtime service account de staging

### SC-009: Producción queda bloqueada hasta tener recursos propios
**Given** que aún no existen las repo vars de producción
**When** se dispara manualmente el deploy de producción (workflow_dispatch)
**Then** el job de producción es no-op (no despliega) hasta que
`vars.CLOUD_RUN_SERVICE_PRODUCTION` y `vars.FIREBASE_PROJECT_ID_PRODUCTION` estén configuradas

### SC-010: El gate de CI y el orden de despliegue se conservan
**Given** la validación de CI y el pipeline de staging
**When** se ejecuta
**Then** CI (lint/typecheck/test/cov/audit/build) pasa antes del deploy
**And** `deploy-backend-staging` (Cloud Run + smoke) precede a `deploy-frontends-staging`

### SC-011: Documentación operativa lista y sincronizada
**Given** `docs/deploy-standards.md`
**When** se lee
**Then** documenta: secrets a crear en Secret Manager, IAM del runtime SA,
acceso cruzado entre `webappriff` y `riff-catalogo-staging`, y datos mínimos de
Firestore staging para que el smoke de catálogo no vacío pase
**And** la tabla de variables refleja las env vars ahora consumidas y las nuevas
vars de producción (vacías)