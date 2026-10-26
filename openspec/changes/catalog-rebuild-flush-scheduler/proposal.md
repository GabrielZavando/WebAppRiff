# Proposal: catalog-rebuild-flush-scheduler

## Why

Hoy cada edición de catálogo (producto, categoría, subcategoría) dispara el
deploy webhook de Coolify de forma inmediata y sin coalescencia
(`WebhookCatalogChangeNotifier`), lo que durante ráfagas de carga encola un
build FIFO por edición y publica versiones intermedias obsoletas durante
mucho rato. El cliente tolera hasta 10 minutos de staleness tras una edición,
y un temporizador en memoria NO es fiable: `riff-api-staging` corre en
Cloud Run con `minScale=0`, `maxScale=2` y CPU throttling, por lo que la
instancia puede desaparecer (o quedarse sin CPU) durante la ventana, y con
dos instancias un debounce en proceso dispararía deploys duplicados.

## What Changes

- **BREAKING (interno, sin cambio de contrato público)**: `notifyChange()` del
  port `ICatalogChangeNotifier` deja de disparar el webhook de Coolify de forma
  directa; pasa a **escribir el cambio en un documento de estado de Firestore**
  (colección interna, documento único) registrando `firstChangeAt` (inicio del
  lote) y `lastChangeAt`. El port y sus emisores no cambian.
- Nuevo endpoint interno `POST /internal/catalog-rebuild/flush` (excluido del
  prefijo global `api/v1` igual que `/health`), invocado por **Cloud Scheduler
  cada minuto**, que decide en una **transacción de Firestore** si corresponde
  disparar el rebuild: ventana de silencio vencida (60 s) **o** max-wait
  alcanzado (300 s), con patrón de **claim** (`claimedAt` con vencimiento corto)
  para no disparar el webhook dos veces con instancias concurrentes.
- El `fetch` a Coolify ocurre **fuera de la transacción**: solo tras una
  respuesta exitosa se limpia el estado; en caso de fallo se conserva el estado
  pendiente y se registra backoff exponencial (`failureCount`, `nextAttemptAt`,
  tope 15 min). Sin dead-letter: reintento indefinido con log escalado.
- Nuevo guard de autenticación **OIDC verificado app-side** con
  `google-auth-library` (dependencia explícita de `apps/backend`): exige firma
  válida, `aud` igual a `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, `email`
  igual a `CATALOG_REBUILD_FLUSH_EXPECTED_SA` y `email_verified`. Fail-closed.
  El gate real es esta verificación, NO el rol `run.invoker`: el servicio está
  desplegado con `--allow-unauthenticated`.
- Nuevo contrato de entorno (por entorno): `CATALOG_REBUILD_SILENCE_SECONDS`
  (60), `CATALOG_REBUILD_MAX_WAIT_SECONDS` (300), `CATALOG_REBUILD_CLAIM_TTL_SECONDS`
  (60), `CATALOG_REBUILD_FLUSH_EXPECTED_AUDIENCE`, `CATALOG_REBUILD_FLUSH_EXPECTED_SA`.
  Las variables existentes `CATALOG_REBUILD_WEBHOOK_URL`/`_TOKEN` se conservan
  (destino del webhook, ahora usado por el endpoint de flush).
- Documentación de infraestructura: creación de la SA dedicada del Scheduler
  (`catalog-rebuild-flusher@<proyecto>`) con `roles/run.invoker` sobre el
  servicio, creación del job de Cloud Scheduler (frecuencia `*/1 * * * *`,
  `--oidc-token-audience` explícito, URL por entorno) y actualización de
  `.env.example` + `docs/deploy-standards.md` + runbook de Cloud Run.
- Sin cambios en `apps/web` ni `apps/admin`. Sin índices compuestos nuevos ni
  reglas de seguridad de Firestore (el documento se accede vía Admin SDK, que
  las ignora). Sin cambios en el `Dockerfile` del backend.

Peor caso de staleness: max-wait (300 s) + build de Coolify (3–4 min) ≈ 9 min,
dentro de la tolerancia de 10 minutos, sin deploys solapados.

## Capabilities

### New Capabilities

(ninguna: el área de comportamiento —notificación de rebuild del catálogo— ya
existe como capability y se modifica en sitio)

### Modified Capabilities

- `generalize-catalog-rebuild-webhook`: la notificación de cambio pasa de
  dispatch directo a **buffering en Firestore**; el webhook se dispara desde el
  nuevo endpoint de flush bajo decisión (silencio/max-wait) con claim
  transaccional, backoff en fallo y gate OIDC app-side; el contrato de entorno
  se amplía con las variables de ventanas y de identidad del Scheduler.

## Impact

- **Backend (`apps/backend`)**:
  - `src/catalog/infrastructure/`: nuevo adaptador de estado en Firestore que
    implementa `ICatalogChangeNotifier` (reemplaza el wiring actual de
    `WebhookCatalogChangeNotifier` en los módulos de productos, categorías y
    subcategorías; la clase actual se reduce/reescribe como cliente de dispatch
    del webhook usado por el flush).
  - Nuevo módulo interno: controlador `POST /internal/catalog-rebuild/flush`
    (exclusión de prefijo en `main.ts`), guard OIDC
    (`google-auth-library`), servicio de flush con transacción de claim y
    máquina de estados.
  - `src/common/guards/health-throttler.guard.ts`: eximir la ruta interna del
    throttler (mismo patrón que `/health`).
  - `package.json` de `apps/backend`: `google-auth-library` como dependencia
    explícita (ya presente transitivamente vía `firebase-admin`).
- **Entorno/infra**: SA + job de Cloud Scheduler por entorno (staging y
  producción), variables nuevas en Secret Manager no requeridas (la identidad
  esperada es config, no secreto).
- **Docs**: `.env.example` (raíz y backend), `docs/deploy-standards.md`,
  `docs/runbooks/backend-staging-cloud-run.md`.
- **No afectado**: `apps/web`, `apps/admin`, API pública `/api/v1`, smoke
  tests, CI. `CATEGORIES_WEBHOOK_URL` no se toca.
