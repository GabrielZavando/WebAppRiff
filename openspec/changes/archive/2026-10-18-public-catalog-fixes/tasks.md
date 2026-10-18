# Tasks

## 1. Backend — no-op observable del notificador (TDD)

- [x] 1.1 Escribir test que falla en
  `apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.spec.ts`:
  con `CATALOG_REBUILD_WEBHOOK_URL` o `CATALOG_REBUILD_WEBHOOK_TOKEN` ausente,
  `notifyChange` no llama a `fetch` y emite un `Logger.warn` que nombra la variable
  faltante sin incluir el token ni la URL. Verificación: `npm test --workspace=apps/backend`
  falla por el test nuevo antes de implementar.
- [x] 1.2 Implementar el `Logger.warn` explícito en `notifyChange`
  (`apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts`)
  manteniendo fire-and-forget y sin filtrar secretos. Verificación: el test 1.1 pasa.
- [x] 1.3 Verificar que los tests existentes que exigen que los logs no contengan
  token/URL y que un fallo no rompa la mutación siguen verdes. Verificación:
  `npm test --workspace=apps/backend` en verde.

## 2. Web — carga del universo completo (TDD)

- [x] 2.1 Escribir test que falla en `apps/web/src/lib/api/__tests__`:
  `getPublicProducts()` paginando con `limit=100` y leyendo `meta.total`, devuelve
  más de 24 productos cuando el backend reporta un total mayor (mock con múltiples
  páginas). Verificación: `npm test --workspace=apps/web` falla por el test nuevo.
- [x] 2.2 Añadir `meta` al tipo de respuesta de productos e implementar el loop de
  paginación en `apps/web/src/lib/api/products.ts` (acumular páginas con `limit=100`
  hasta cubrir `meta.total`, conservando el cache a nivel de módulo). Verificación:
  el test 2.1 pasa.
- [x] 2.3 Añadir test de degradación: si una página del API falla o el API está
  caído, `getPublicProducts()` resuelve `[]` y emite `console.warn`. Verificación:
  el test pasa y `astro build` no falla ante API caída.
- [x] 2.4 Verificar que el catálogo hornea el universo completo: con el backend
  devolviendo >24 publicados, `getStaticPaths` de `/productos/[slug]` y el grid
  incluyen todos los productos. Verificación: test/assert de que el número de cards
  horneadas y de rutas generadas iguala el total recibido.

## 3. Ops — configuración del webhook en staging y runbook

- [x] 3.1 Crear el deploy webhook del recurso `web-staging` en Coolify y anotar su
  URL y token. Verificación: `curl -X POST <webhook-url>` dispara un deploy (o
  responde aceptado) en el panel de Coolify.
- [x] 3.2 Inyectar `CATALOG_REBUILD_WEBHOOK_URL` y `CATALOG_REBUILD_WEBHOOK_TOKEN`
  en el servicio Cloud Run `riff-api-staging`. Verificación:
  `gcloud run services describe riff-api-staging --region=southamerica-west1`
  muestra ambas variables.
- [x] 3.3 Documentar en `docs/runbooks/backend-staging-cloud-run.md` cómo crear el
  webhook en Coolify y cómo inyectar las variables (reemplazando la nota de "no-op
  en staging"). Verificación: los comandos documentados corren tal cual contra
  staging.

## 4. Verificación de integración

- [x] 4.1 Ciclo end-to-end en staging: editar el título de un producto en el admin,
  confirmar el disparo del webhook, esperar el rebuild de Coolify y ver el título
  nuevo en `staging.somosriff.cl`. Verificación: título actualizado visible.
- [x] 4.2 Verificar el catálogo completo en staging: el listado muestra los productos
  publicados (≈70) con su paginación correcta (≈8 páginas de 9) y las páginas de
  detalle generadas para todos. Verificación: conteo de cards y de páginas coincide
  con `meta.total`.
- [x] 4.3 Ejecutar los gates del repo. Verificación:
  `npx openspec validate --all --strict` y `make ci` en verde.
