# Design — fix-cloud-run-runtime-configuration

## Contexto

`deploy-backend-staging` (`.github/workflows/deploy.yml`) llama a
`google-github-actions/deploy-cloudrun@v2` con `service`/`region`/`image` a secas.
En un primer deploy real, `riff-api-staging` arrancaría sin runtime SA, sin
`FIREBASE_*`, sin CORS y sin acesso público → el bootstrap aborta (`getOrThrow`) o
ADC falla contra el proyecto Firebase de staging.

Verificado en el código: `main.ts` + `cors.config.ts` + `resolvePort()` ya leen las
env vars y respetan `PORT` inyectado por Cloud Run; no requieren cambios. Solo
hará falta configurar bien el deploy step.

## Decisión de diseño

### 1. `deploy-backend-staging` — deploy-cloudrun completo

```yaml
- name: Deploy to Cloud Run (staging)
  uses: google-github-actions/deploy-cloudrun@v2
  with:
    service: ${{ vars.CLOUD_RUN_SERVICE }}
    region: ${{ vars.GCP_REGION }}
    image: ${{ vars.GCP_REGION }}-docker.pkg.dev/${{ vars.GCP_PROJECT }}/${{ vars.GCP_ARTIFACT_REPOSITORY }}/riff-backend:sha-${{ github.event.workflow_run.head_sha }}
    env_vars: |
      FIREBASE_PROJECT_ID=${{ vars.FIREBASE_PROJECT_ID }}
      FIREBASE_STORAGE_BUCKET=${{ vars.FIREBASE_STORAGE_BUCKET }}
      NODE_ENV=production
      ASTRO_SITE_URL=${{ vars.SMOKE_WEB_STAGING_URL }}
      ANGULAR_ADMIN_URL=${{ vars.SMOKE_ADMIN_STAGING_URL }}
    secrets: |
      CATALOG_REBUILD_WEBHOOK_URL=CATALOG_REBUILD_WEBHOOK_URL:latest
      CATALOG_REBUILD_WEBHOOK_TOKEN=CATALOG_REBUILD_WEBHOOK_TOKEN:latest
    flags: |
      --service-account=${{ vars.GCP_RUNTIME_SA }}
      --allow-unauthenticated
```

- `env_vars` se escribe como bloque multilinea (formato `KEY=value` soportado por
  el action).
- `secrets` referencia nombres literales en Secret Manager del proyecto
  `webappriff`, versión `latest`. El action los monta como env vars del servicio;
  los valores nunca aparecen en el workflow ni en los logs.
- `flags` pasa `--service-account` y `--allow-unauthenticated` como flags de
  `gcloud run deploy`.

### 2. Parametrización de rutas (R7)

Reemplazar los literales que se repiten en el lane de staging:

- `service: riff-api-staging` → `vars.CLOUD_RUN_SERVICE`
- `riff/riff-backend:sha-<commit>` (build-push y deploy) →
  `${vars.GCP_ARTIFACT_REPOSITORY}/riff-backend`
- Los `gcloud run services describe riff-api-staging` del smoke y del rollback-hint
  pasan a `vars.CLOUD_RUN_SERVICE`.

Nota de valor real: `GCP_ARTIFACT_REPOSITORY=riff` (el repositorio), la imagen sigue
siendo `riff-backend`; la ruta completa queda `riff/riff-backend`.

### 3. Lane de producción bloqueada (R8/R9)

Introducir repo vars de producción **nuevas y vacías** y gatear sus jobs:

- `CLOUD_RUN_SERVICE_PRODUCTION`, `FIREBASE_PROJECT_ID_PRODUCTION`,
  `FIREBASE_STORAGE_BUCKET_PRODUCTION`, `SMOKE_WEB_PRODUCTION_URL`,
  `SMOKE_ADMIN_PRODUCTION_URL` (y `GCP_RUNTIME_SA_PRODUCTION` si difiere).
- Gates: `vars.CLOUD_RUN_SERVICE_PRODUCTION != '' &&
  vars.FIREBASE_PROJECT_ID_PRODUCTION != ''` en `deploy-backend-production` y
  `deploy-frontends-production`. Hoy vacías → no-op (aunque se haga dispatch).

### 4. Docs (`docs/deploy-standards.md`)

- Nueva sección **"Secretos + IAM necesarios antes del primer deploy"**:
  1. Secret Manager (`webappriff`): `CATALOG_REBUILD_WEBHOOK_URL`,
     `CATALOG_REBUILD_WEBHOOK_TOKEN` (versión `latest`).
  2. Runtime SA `riff-api-runtime@webappriff.iam.gserviceaccount.com`:
     `roles/secretmanager.secretAccessor` (sobre esos secrets en `webappriff`),
     `roles/datastore.user` + storage (admin/objectAdmin) sobre
     `riff-catalogo-staging`, y el permiso que permita al Deploy SA
     `iam.serviceAccountUser` sobre el runtime SA.
  3. Cross-project: el runtime SA vive en `webappriff` pero debe leer Firestore del
     proyecto Firebase `riff-catalogo-staging` → grant de `datastore.user` cruzado.
  4. Seed mínimo de Firestore staging (ejecutar `seed-catalog` y `seed-productos`
     contra `riff-catalogo-staging`) para que el smoke de catálogo no vacío pase.
- Tabla de env: reflejar las env vars ahora consumidas en staging + las vars de
  producción nuevas (vacías).

## Archivos afectados

- `.github/workflows/deploy.yml` (staging deploy-cloudrun + parametrizar service/image
  + lanes de producción gated + smoke/rollback var).
- `docs/deploy-standards.md` (env table + sección OPS + rollback ref).

## Validación

- YAML de `deploy.yml` parsea.
- `bash check-refs.sh` y `bash specboot.sh --ci` en verde.
- Builds Docker de las 3 imágenes en verde (igual que CI).
- `openspec validate fix-cloud-run-runtime-configuration` válido.