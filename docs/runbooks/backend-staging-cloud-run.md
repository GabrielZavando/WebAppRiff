# Runbook — Deploy del backend a Cloud Run (staging, proyecto `riff-catalogo-staging`)

> Change `backend-staging-deploy`. Despliega el backend NestJS
> (`apps/backend`) como servicio Cloud Run `riff-api-staging` **dentro del
> proyecto `riff-catalogo-staging`**, para alinear identidad Firebase, datos y
> API en un solo proyecto y desbloquear la verificación 7.5 de
> `deploy-docker-hardening`.
>
> Contexto y decisiones: `docs/deploy-standards.md` y
> `openspec/changes/backend-staging-deploy/design.md`.

## 0. Parámetros y prerrequisitos

Variables usadas en todos los comandos (copiar y ajustar `SHA`):

```bash
export PROJECT_ID=riff-catalogo-staging
export REGION=southamerica-west1
export SA_NAME=riff-api-runtime
export SA_EMAIL=${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com
export REPO=riff
export IMAGE=${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/riff-backend
export SHA=$(git rev-parse --short HEAD)   # tag sha-<commit>; `latest` prohibido
export SERVICE=riff-api-staging
```

- **Billing**: ya habilitado en `riff-catalogo-staging` (confirmado por el
  owner el 2026-10-13).
- **Autenticación local**: `gcloud auth login` y
  `gcloud config set project ${PROJECT_ID}`.
- **Permisos sugeridos del operador** (o de quien ejecute cada paso):
  `roles/run.admin` (deploy), `roles/iam.serviceAccountUser` sobre
  `${SA_EMAIL}` (adjuntarla al servicio), `roles/iam.serviceAccountAdmin`
  (crear la SA), `roles/resourcemanager.projectIamAdmin` (policy bindings),
  `roles/artifactregistry.admin` (crear repo) y `roles/artifactregistry.writer`
  (push).
- El servicio homónimo `riff-api-staging` del proyecto `webappriff` está
  **congelado** (deuda de decomisión futura): no desplegar ni modificar ese
  proyecto. Distinguir siempre con `--project`.

## 1. Habilitar APIs

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  --project=${PROJECT_ID}
```

## 2. Runtime service account (ADC, mínimo privilegio)

Crear la SA dedicada y otorgar **exactamente dos roles** a nivel de proyecto:

```bash
gcloud iam service-accounts create ${SA_NAME} \
  --display-name="Riff API runtime (staging)" \
  --project=${PROJECT_ID}

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectAdmin"
```

> El runtime autentica contra Firebase Admin por **ADC** (sin JSON keys ni
> `FIREBASE_PRIVATE_KEY`). Estos dos roles cubren Firestore y Storage; la
> verificación de tokens del Admin SDK no requiere permisos adicionales.

## 3. Repo de Artifact Registry

```bash
gcloud artifacts repositories create ${REPO} \
  --repository-format=docker \
  --location=${REGION} \
  --project=${PROJECT_ID}
```

## 4. Build y push de la imagen

Desde la **raíz del monorepo** (el Dockerfile exige el lockfile raíz como
contexto):

```bash
gcloud auth configure-docker ${REGION}-docker.pkg.dev

docker build -f apps/backend/Dockerfile \
  -t ${IMAGE}:sha-${SHA} .

docker push ${IMAGE}:sha-${SHA}
```

> Verificación local previa opcional: `make docker-build-backend`
> (mismo build, tag de prueba, sin push).

## 5. Deploy en Cloud Run

```bash
gcloud run deploy ${SERVICE} \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --image=${IMAGE}:sha-${SHA} \
  --service-account=${SA_EMAIL} \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=2 \
  --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=${PROJECT_ID},FIREBASE_STORAGE_BUCKET=${PROJECT_ID}.firebasestorage.app,ASTRO_SITE_URL=https://staging.somosriff.cl,ANGULAR_ADMIN_URL=https://admin-staging.somosriff.cl"
```

Notas:

- `PORT` **no** se fija: Cloud Run inyecta `PORT=8080` y `resolvePort` lo lee.
- Sin `RESEND_API_KEY` el notifier es no-op con warning: los leads se persisten
  en Firestore pero no se notifican. Ver paso 5.2. El webhook de rebuild del
  catálogo se activa en el paso 5.1 (Coolify + Secret Manager + flush
  programado con Cloud Scheduler, paso f); si no se configura, el backend
  registra un `warn` explícito y no buferiza cambios ni dispara rebuilds
  (no-op observable, sin fallo silencioso).
- Escalado a cero (`--min-instances=0`); techo `--max-instances=2`.
- Sin dominio propio: usar la URL `*.run.app` que imprime el comando y
  anótala:

```bash
export API_URL=$(gcloud run services describe ${SERVICE} \
  --project=${PROJECT_ID} --region=${REGION} --format='value(status.url)')
echo "URL staging: ${API_URL}"
```

## 5.1 Activar el rebuild del catálogo (webhook de Coolify + secretos + flush programado)

> Changes `public-catalog-fixes` + `catalog-rebuild-flush-scheduler`. Cuando
> cambia cualquier entidad pública del catálogo, el backend **buferiza el cambio
> en Firestore** (documento `catalog_rebuild_state/global`) en vez de disparar
> el webhook de inmediato. Un job de **Cloud Scheduler** invoca cada minuto el
> endpoint interno `POST /internal/catalog-rebuild/flush`, que dispara el
> webhook de Coolify (`CATALOG_REBUILD_WEBHOOK_URL` con `Authorization: Bearer
> CATALOG_REBUILD_WEBHOOK_TOKEN`) cuando se cumple la ventana de silencio (60 s)
> o el max-wait (300 s). Sin las variables del webhook el backend solo registra
> un `warn` (no-op observable). Ver `docs/deploy-standards.md` →
> "Rebuild programado del catálogo".

> ⚠️ **Orden de activación**: el deploy del backend (paso 5) detiene el disparo
> inmediato; crear el job del Scheduler (paso **f** de esta sección)
> inmediatamente después de los secretos minimiza la ventana sin rebuilds. El
> primer flush publica el lote acumulado.

**a. Crear el deploy webhook del frontend en Coolify** (panel, manual):

1. En Coolify, abrir el recurso del sitio público de staging (`web-staging`, que
   sirve `https://staging.somosriff.cl`).
2. Ir a **Webhooks → Deploy Webhook** y copiar la URL generada
   (p. ej. `https://coolify.<host>/api/v1/deploy?uuid=<uuid>&force=true`).
   La URL **debe** llevar `&force=true` (no `force=false`): Coolify reutiliza la
   caché de Docker entre builds y, sin `force=true`, el build de Astro puede
   salir de capas cacheadas y publicar HTML obsoleto (el catálogo no refleja los
   cambios). El deploy webhook de Coolify acepta un `POST` autenticado con el
   token configurado en el recurso; ese token es el valor de
   `CATALOG_REBUILD_WEBHOOK_TOKEN`.
3. (Recomendado) rotar/definir un token dedicado para el backend y guardarlo; no
   se expone en logs ni en el cuerpo de la petición.

**b. Guardar URL y token como secretos en Secret Manager**:

```bash
printf '%s' "https://coolify.<host>/api/v1/deploy?uuid=<uuid>&force=true" | \
  gcloud secrets create CATALOG_REBUILD_WEBHOOK_URL \
  --project=${PROJECT_ID} --data-file=-

printf '%s' "<coolify-deploy-token>" | \
  gcloud secrets create CATALOG_REBUILD_WEBHOOK_TOKEN \
  --project=${PROJECT_ID} --data-file=-
```

**c. Permitir al runtime SA leer los secretos**:

```bash
for SECRET in CATALOG_REBUILD_WEBHOOK_URL CATALOG_REBUILD_WEBHOOK_TOKEN; do
  gcloud secrets add-iam-policy-binding ${SECRET} \
    --project=${PROJECT_ID} \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor"
done
```

**d. Montarlos en el servicio** (añadir al `gcloud run deploy` del paso 5; repetir
el deploy con los mismos flags más esta línea):

```bash
  --set-secrets "CATALOG_REBUILD_WEBHOOK_URL=CATALOG_REBUILD_WEBHOOK_URL:latest,CATALOG_REBUILD_WEBHOOK_TOKEN=CATALOG_REBUILD_WEBHOOK_TOKEN:latest"
```

**e. Verificar**:

```bash
gcloud run services describe ${SERVICE} \
  --project=${PROJECT_ID} --region=${REGION} \
  --format='value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep CATALOG_REBUILD
# Esperado: ambas variables presentes (referenciando el secreto, sin valor plano).
```

**f. Activar el flush programado del rebuild (Cloud Scheduler + SA OIDC)**:

> Change `catalog-rebuild-flush-scheduler`. El gate real del endpoint de flush
> es la **verificación OIDC app-side** (`SchedulerOidcGuard`): firma Google,
> `aud` = `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, `email` =
> `CATALOG_REBUILD_FLUSH_EXPECTED_SA` y `email_verified`, fail-closed. El rol
> `roles/run.invoker` es **solo defensa en profundidad**: el servicio corre con
> `--allow-unauthenticated`, así que IAM no filtra nada por sí solo.

1. Service account dedicada del Scheduler:

   ```bash
   gcloud iam service-accounts create catalog-rebuild-flusher \
     --project=${PROJECT_ID} \
     --display-name="Catalog rebuild flush scheduler"
   ```

2. `roles/run.invoker` sobre el servicio (defensa en profundidad):

   ```bash
   gcloud run services add-iam-policy-binding ${SERVICE} \
     --project=${PROJECT_ID} --region=${REGION} \
     --member="serviceAccount:catalog-rebuild-flusher@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/run.invoker"
   ```

3. Variables del endpoint (añadir al `gcloud run deploy` del paso 5; repetir el
   deploy con los mismos flags más estas líneas):

   ```bash
   --update-env-vars "CATALOG_REBUILD_SILENCE_SECONDS=60,CATALOG_REBUILD_MAX_WAIT_SECONDS=300,CATALOG_REBUILD_CLAIM_TTL_SECONDS=60,CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE=https://${SERVICE_URL#https://},CATALOG_REBUILD_FLUSH_EXPECTED_SA=catalog-rebuild-flusher@${PROJECT_ID}.iam.gserviceaccount.com"
   ```

   > `SERVICE_URL` es la URL `*.run.app` del paso 5 (`status.url`). La audience
   > debe fijarse **explícitamente**: el servicio tiene varias URLs (run.app y,
   > si aplica, dominio propio) y el token debe llevar la que el backend espera.

4. Job del Scheduler: frecuencia cada minuto, `POST` a la URL del entorno,
   OIDC con audience explícita y **sin reintentos propios** (los reintentos son
   propiedad del backoff del backend; un retry del Scheduler duplicaría
   despachos):

   ```bash
   gcloud scheduler jobs create http catalog-rebuild-flush \
     --project=${PROJECT_ID} --location=${REGION} \
     --schedule="*/1 * * * *" \
     --uri="${SERVICE_URL}/internal/catalog-rebuild/flush" \
     --http-method=POST \
     --oidc-service-account-email="catalog-rebuild-flusher@${PROJECT_ID}.iam.gserviceaccount.com" \
     --oidc-token-audience="${SERVICE_URL}" \
     --no-retry-config
   ```

5. **Verificación end-to-end**:

   ```bash
   # APIs necesarias (paso 1 del runbook ya cubre cloudscheduler; si no):
   gcloud services enable cloudscheduler.googleapis.com --project=${PROJECT_ID}

   # Ciclo end-to-end: editar el título de un producto en el admin de staging,
   # esperar 1-2 minutos y verificar:
   gcloud logging read \
     'resource.type=cloud_run_revision AND textPayload:"catalog-rebuild-flush"' \
     --project=${PROJECT_ID} --limit=10
   # Esperado: UNA línea de dispatch exitoso por lote (sin fallos 401 ni 429),
   # un único deploy en Coolify y el doc catalog_rebuild_state/global limpio
   # (consola de Firestore, proyecto riff-catalogo-staging).
   ```

6. **Rollback**: al revertir la revisión de Cloud Run (sección Rollback), pausar
   el job para evitar ruido de 401/404 en los logs del Scheduler y reactivarlo
   al restaurar:

   ```bash
   gcloud scheduler jobs pause catalog-rebuild-flush --location=${REGION}
   gcloud scheduler jobs resume catalog-rebuild-flush --location=${REGION}
   ```

## 5.2 Activar el email transaccional (Resend + subdominio `send.somosriff.cl`)

> Change `email-notifications-resilience`. Los formularios públicos persisten el
> lead en Firestore antes de notificar; la notificación es best-effort (si
> Resend falla, el backend lo registra en logs y responde éxito igualmente). Sin
> `RESEND_API_KEY` el adaptador es no-op con warning: los leads se guardan pero
> no se envían correos.

**a. Verificar el subdominio en Resend** (panel, manual — cliente/ops):

1. En Resend → **Domains**, añadir `send.somosriff.cl` (subdominio dedicado para
   no tocar el DNS principal de `somosriff.cl`).
2. Publicar en el DNS los registros SPF/DKIM que Resend indique.
3. Esperar el estado **Verified**. El remitente debe ser un buzón de ese
   subdominio (p. ej. `notificaciones@send.somosriff.cl`).

**b. Crear el secreto con la API key**:

```bash
printf '%s' "<resend-api-key>" | \
  gcloud secrets create RESEND_API_KEY \
  --project=${PROJECT_ID} --data-file=-
```

Si el secreto ya existe, agregar una versión nueva:

```bash
printf '%s' "<resend-api-key>" | \
  gcloud secrets versions add RESEND_API_KEY \
  --project=${PROJECT_ID} --data-file=-
```

**c. Permitir al runtime SA leer el secreto**:

```bash
gcloud secrets add-iam-policy-binding RESEND_API_KEY \
  --project=${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/secretmanager.secretAccessor"
```

**d. Montarlo en el servicio** (usar `--update-*` para no borrar los secretos y
variables del paso 5.1):

```bash
gcloud run services update ${SERVICE} \
  --project=${PROJECT_ID} \
  --region=${REGION} \
  --update-secrets "RESEND_API_KEY=RESEND_API_KEY:latest" \
  --update-env-vars "CONTACT_TO_EMAIL=contacto@somosriff.cl,CONTACT_FROM_EMAIL=notificaciones@send.somosriff.cl"
```

**e. Verificar**:

```bash
gcloud run services describe ${SERVICE} \
  --project=${PROJECT_ID} --region=${REGION} \
  --format='value(spec.template.spec.containers[0].env)' | tr ',' '\n' | grep -E 'RESEND|CONTACT_'
# Esperado: RESEND_API_KEY referenciando el secreto (sin valor plano) y las
# variables CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL presentes.

# Smoke funcional: enviar un contacto y una cotización desde staging, confirmar
# el documento en Firestore (colecciones `contactos` / `cotizaciones`) y el
# correo recibido en contacto@somosriff.cl.
```

> Rollback: quitar el secreto del servicio (`--remove-secrets RESEND_API_KEY`) o
> dejar de montarlo. El backend vuelve al modo no-op con warning sin afectar la
> persistencia de leads.

## 6. Smoke post-deploy

```bash
SMOKE_API_URL=${API_URL} npm run smoke:api
# Esperado: /health OK (status healthy, firebase up) + products/categories/
# subcategories con arreglo `data`.

curl -i ${API_URL}/api/v1/auth/me
# Esperado: HTTP 401 (FirebaseAuthGuard, sin token).

# CORS (allowlist estricta en NODE_ENV=production):
curl -s -i -X OPTIONS ${API_URL}/api/v1/products \
  -H "Origin: https://admin-staging.somosriff.cl" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control-allow-origin
# Esperado: access-control-allow-origin: https://admin-staging.somosriff.cl
```

Si `/health` responde `firebase: down`, revisar los IAM del paso 2.

## 7. Coolify (panel, manual)

En la app `riff-admin-staging`:

1. Build Variable `API_BASE_URL=${API_URL}/api/v1` (contrato: incluir
   `/api/v1`).
2. Build Variables Firebase del proyecto staging, si faltan:
   `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN` (`riff-catalogo-staging
   .firebaseapp.com`), `FIREBASE_PROJECT_ID=riff-catalogo-staging`,
   `FIREBASE_APP_ID`.
3. Redeploy de la app y verificar que el bundle quedó con los valores
   (`npm run test:build --workspace=@riff/admin` detecta placeholders).

## 8. Verificación final del admin (desbloquea 7.5)

Desde `https://admin-staging.somosriff.cl`: login con
`soporte@gabrielzavando.cl` y carga del perfil (`/api/v1/auth/me` → 200 con
datos del usuario). Al confirmarse, actualizar la nota de bloqueo de la tarea
7.5 en `openspec/changes/archive/2026-10-12-deploy-docker-hardening/tasks.md`.

## Rollback

- **Sin consumidores aún** (paso 7 pendiente):
  `gcloud run services delete ${SERVICE} --project=${PROJECT_ID} --region=${REGION}`.
- **Con deploys buenos previos**: dirigir el tráfico a la revisión sana:
  ```bash
  gcloud run services update-traffic ${SERVICE} \
    --project=${PROJECT_ID} --region=${REGION} --to-revisions=<REVISION>=100
  ```
- El servicio antiguo de `webappriff` **no se toca en ningún caso**.

## 9. Regla de ciclo de vida del bucket (uploads huérfanos)

> Requisito de `admin-uploads` (task 5.1). Los endpoints
> `POST /api/v1/uploads/*` escriben siempre bajo
> `productos/<productoId>/tmp-<uuid>/` (o `productos/tmp-<uuid>/` en creación).
> La limpieza de los huérfanos es responsabilidad del **bucket**, no del
> backend: sin esta regla, cada subida descartada del formulario se acumula
> para siempre en Storage.

Ejecutar una sola vez con el operador autenticado en
`riff-catalogo-staging` (permisos: `roles/storage.admin` sobre el proyecto o el
bucket). El bucket real de Storage del proyecto es
`riff-catalogo-staging.firebasestorage.app` (nomenclatura actual de Firebase;
coincide con `FIREBASE_STORAGE_BUCKET` en `apps/backend/.env`):

```bash
gcloud storage buckets update gs://riff-catalogo-staging.firebasestorage.app \
  --project=${PROJECT_ID} \
  --lifecycle-file=<(cat <<'JSON'
[
  {
    "action": {"type": "Delete"},
    "condition": {
      "age": 48,
      "matchesPrefix": ["productos/tmp-"]
    }
  }
]
JSON
)
```

Notas sobre la regla:

- `age: 48` + `matchesPrefix: productos/tmp-` borra **solo** objetos cuyo path
  comience con ese prefijo literal: los objetos finales de migración
  (`productos/<id>/<nombre>.webp`) no se tocan. Los uploads HTTP del backend
  (`admin-uploads`, design D5) van siempre a `productos/tmp-<uuid>/` (creación
  y edición), así que el prefijo único matchea el 100% de los huérfanos.
  Nota: si el formato del archivo de la regla es un array plano, `gcloud
  storage buckets update` falla con `'list' object has no attribute 'items'`;
  usar el objeto envuelto en `"rule"`, como arriba.
- La condición por edad es > 48 horas desde la última modificación del objeto
  (creación, en la práctica).

Verificación (escenario de prueba, siempre con objeto desechable bajo `tmp-`):

```bash
# 1. Subir un objeto de prueba (el propio endpoint crea tmp-<uuid>):
curl -fsS -X POST "${API_URL}/api/v1/uploads/images" \
  -H "Authorization: Bearer <token-valido-editor>" \
  -F "file=@/tmp/spotcheck.webp" | tee /tmp/spotcheck.json
SPOT_PATH=$(node -e "console.log(JSON.parse(require('fs').readFileSync('/tmp/spotcheck.json')).data.storagePath)")

# 2. Confirmar que el objeto existe y cae bajo un directorio tmp-:
gcloud storage ls "gs://riff-catalogo-staging.firebasestorage.app/${SPOT_PATH}" --project=${PROJECT_ID}
# → debe imprimir la URL del objeto y NO debe faltar 'tmp-' en el path.

# 3. Confirmar la regla activa en el bucket:
gcloud storage buckets describe gs://riff-catalogo-staging.firebasestorage.app \
  --project=${PROJECT_ID} --format=json | jq '.lifecycle_config'
```

El borrado real (> 48 h) se verifica en stage posterior (tarea 5.3 del change
`admin-uploads`): spot-check con objeto de prueba cuya edad supere la ventana.

## Notas

- **Rebuild del catálogo**: se activa en el paso 5.1 (webhook de Coolify +
  Secret Manager). Sin `CATALOG_REBUILD_WEBHOOK_URL`/`_TOKEN`, el backend solo
  emite un `warn` explícito al mutar catálogo (no-op observable). El rebuild es
  un build completo de Astro (tarda minutos), no una revalidación parcial.
- **Catálogo vacío**: el smoke solo exige arreglo `data`; para smoke "no
  vacío", ejecutar `npm run seed:catalog` / `npm run seed:productos` apuntando
  a `riff-catalogo-staging` (ADC local: `gcloud auth application-default
  login`).
- **Deuda de decomisión**: el `riff-api-staging` legacy de `webappriff` queda
  congelado; su baja se resuelve en un change futuro.
