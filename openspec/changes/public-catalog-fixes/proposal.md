# Proposal

## Why

El catálogo público (`apps/web`, `staging.somosriff.cl`) no refleja las ediciones
del panel admin: los títulos cambiados siguen mostrando el valor antiguo, y de los
70 productos publicados en Firestore solo se muestran 24 (3 páginas de 9). Ninguna
de las dos fallas es de datos: el sitio Astro es SSG puro (`output: 'static'`) y
(a) en staging el webhook de rebuild está deliberadamente en no-op, sin pipeline que
regenere el HTML, y (b) el build pide `GET /api/v1/products` sin paginar, por lo que
el `DEFAULT_LIMIT = 24` del backend recorta el universo y el front nunca lee
`meta.total`.

## What Changes

**Capability A — Sincronización (rebuild por webhook)**
- Activar el rebuild del catálogo en staging: configurar `CATALOG_REBUILD_WEBHOOK_URL`
  y `CATALOG_REBUILD_WEBHOOK_TOKEN` en Cloud Run (`riff-api-staging`) apuntando al
  webhook de deploy de Coolify del sitio `web-staging`.
- Hacer observable el no-op: cuando falte la URL o el token, el notificador SHALL
  emitir un `Logger.warn` explícito (hoy retorna en silencio), sin filtrar secretos.
- Documentar en `docs/runbooks/backend-staging-cloud-run.md` cómo crear el webhook en
  Coolify y cómo inyectar las variables en Cloud Run.

**Capability B — Paginación (universo completo en SSG)**
- Refactorizar `getPublicProducts()` en `apps/web/src/lib/api/products.ts` para leer
  `meta.total` y paginar en bloques de `limit=100` hasta traer todos los productos
  publicados.
- Hornear el universo completo en el SSG (catálogo y `getStaticPaths` de detalle),
  de modo que `applyProductFilters` pagine sobre los 70 productos.
- Actualizar los tests para verificar que se carga el universo completo (más que el
  `pageSize` del sitio y que el `limit` por defecto del API) y que el fallback sigue
  funcionando.

**Fuera de alcance**: no se cambia la arquitectura de hosting ni el modelo de datos;
no se implementa SSR (Opción 2) ni islas con Firestore directo (Opción 3), solo se
documentan como alternativas futuras en `design.md`.

## Capabilities

### New Capabilities
<!-- Ninguna: ambas fallas se resuelven modificando capacidades existentes. -->

### Modified Capabilities
- `generalize-catalog-rebuild-webhook`: el no-op por configuración ausente pasa de
  silencioso a observable con `Logger.warn` explícito.
- `products-catalog-page`: la carga build-time de productos pasa de una única llamada
  sin paginar a paginar por `meta.total` hasta traer el universo completo publicado.

## Impact

- Código: `apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts`;
  `apps/web/src/lib/api/products.ts`; tests asociados.
- Ops/infra: variables `CATALOG_REBUILD_*` en Cloud Run staging y webhook de Coolify;
  `docs/runbooks/backend-staging-cloud-run.md`.
- Contrato API: sin cambios de endpoint; se consume el `meta.total` ya existente en
  la envoltura `{ data, error, meta }`.
- Sin migración de datos ni cambios de esquema Firestore.
