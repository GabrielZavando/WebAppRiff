# Tasks — generalize-catalog-rebuild-webhook

> Capas backend: `domain` (puerto), `application` (services consumidores),
> `infrastructure` (transporte webhook). `.specboot.json` declara `services: ["."]`.

## Task 1 — Definir el puerto `ICatalogChangeNotifier` y eliminar el de categorías (RED)

**Prioridad**: Alta · **Capa**: domain · **Estimación**: S

- [x] Crear `apps/backend/src/catalog/domain/icatalog-change-notifier.ts` (o `categorias/domain/` si se mantiene agrupado) con:
  - `type CatalogEntityType = 'category' | 'subcategory' | 'product'`
  - `type CatalogChangeAction = 'created' | 'updated' | 'deleted' | 'published' | 'unpublished'`
  - `interface CatalogChangeEvent { entityType; id; action; occurredAt }`
  - `interface ICatalogChangeNotifier { notifyChange(event): void | Promise<void> }`
  - const token `I_CATALOG_CHANGE_NOTIFIER`
- [x] Eliminar `icategory-change-notifier.ts` y su contract spec, migrando el contract test al nuevo puerto (renombrar `icategory-change-notifier.contract.spec.ts` → `icatalog-change-notifier.contract.spec.ts`).
- [x] (RED) Actualizar/crear el contract test que fuerza a cualquier implementación a satisfacer el nuevo puerto; verificar que falla antes de implementar el transporte.

**Suggested Path**: `apps/backend/src/catalog/domain/icatalog-change-notifier.ts`
**Test Path**: `apps/backend/src/catalog/domain/`

## Task 2 — Implementar `WebhookCatalogChangeNotifier` (Bearer + timeout + no-op)

**Prioridad**: Alta · **Capa**: infrastructure · **Estimación**: M

- [x] Crear `apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts`:
  - Lee `CATALOG_REBUILD_WEBHOOK_URL` y `CATALOG_REBUILD_WEBHOOK_TOKEN`.
  - No-op si URL vacía; fire-and-forget; `POST` con `Authorization: Bearer <token>` y `content-type: application/json`.
  - Timeout con `AbortSignal.timeout(5000)` (o configurable); catch → `logger.warn` con `String(error)` sin token ni URL.
- [x] TDD: specs del notifier (env vars mockeadas) cubriendo SC-004/005/006/007/008.
- [x] (RED) Añadir spec SC-011: `fetchMock.mockResolvedValue({ ok: false, status: 500 })` → el notifier loguea warning con status y type/action, sin token ni URL.
- [x] Ampliar el `dispatch` para inspeccionar `response.ok`: si es `false`, `logger.warn("...HTTP <status> for <entity>/<action>...")`; nunca lanza.
- [x] Reemplazar `WebhookCategoryChangeNotifier`; eliminar ese archivo tras confirmar 0 consumidores.

**Suggested Path**: `apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts`
**Test Path**: `apps/backend/src/catalog/infrastructure/`

## Task 3 — Conectar categorías al nuevo notifier

**Prioridad**: Alta · **Capa**: application + infrastructure · **Estimación**: S

- [x] `categorias.module.ts`: `provide: I_CATALOG_CHANGE_NOTIFIER, useClass: WebhookCatalogChangeNotifier`, exportar el token.
- [x] `categoria.service.ts`: cambiar inyección de `I_CATEGORY_CHANGE_NOTIFIER` → `I_CATALOG_CHANGE_NOTIFIER`, y `notifyChange` con evento tipado `category`.
- [x] Ajustar specs de `categoria.service` al nuevo evento.

**Suggested Path**: `apps/backend/src/categorias/application/categoria.service.ts`, `apps/backend/src/categorias/categorias.module.ts`
**Test Path**: `apps/backend/src/categorias/`

## Task 4 — Conectar subcategorías al notifier

**Prioridad**: Alta · **Capa**: application + infrastructure · **Estimación**: S

- [x] `subcategorias.module.ts`: importar/exportar `I_CATALOG_CHANGE_NOTIFIER` (via `CategoriasModule` u otro módulo compartido).
- [x] `subcategoria.service.ts`: inyectar `I_CATALOG_CHANGE_NOTIFIER` y llamar `notifyChange` tras create/update/remove con `entityType: 'subcategory'`.
- [x] Specs de `subcategoria.service` para los 3 casos.

**Suggested Path**: `apps/backend/src/subcategorias/application/subcategoria.service.ts`, `apps/backend/src/subcategorias/subcategorias.module.ts`
**Test Path**: `apps/backend/src/subcategorias/`

## Task 5 — Conectar productos al notifier

**Prioridad**: Alta · **Capa**: application + infrastructure · **Estimación**: S

- [x] `productos.module.ts`: exportar/importar `I_CATALOG_CHANGE_NOTIFIER`.
- [x] `producto-write.service.ts`: inyectar `I_CATALOG_CHANGE_NOTIFIER` y llamar `notifyChange` tras create/update (detectando publicar/despublicar por `publicado`) y remove, con `entityType: 'product'`.
- [x] Specs de `producto-write.service` para create/update(+publish/unpublish)/remove.

**Suggested Path**: `apps/backend/src/productos/application/producto-write.service.ts`, `apps/backend/src/productos/productos.module.ts`
**Test Path**: `apps/backend/src/productos/`

## Task 6 — Migrar env y docs

**Prioridad**: Media · **Capa**: infra/docs · **Estimación**: S

- [x] `.env.example` (raíz) y `apps/backend/.env.example`: reemplazar `CATEGORIES_WEBHOOK_URL` por `CATALOG_REBUILD_WEBHOOK_URL` + `CATALOG_REBUILD_WEBHOOK_TOKEN` (con comentario de uso/seguridad).
- [x] `docs/deploy-standards.md`: tabla de env con las 2 nuevas variables (secretos de NestJS en Secret Manager, fuera de este change) y mención del Bearer.
- [x] `grep -r 'CATEGORIES_WEBHOOK_URL' apps/ docs/ .env.example` → 0 ocurrencias (migrado).

**Suggested Path**: `.env.example`, `apps/backend/.env.example`, `docs/deploy-standards.md`
**Test Path**: no aplica (docs/env; verificar grep)

## Task 7 — Verificación de suite completa

**Prioridad**: Alta · **Capa**: transversal · **Estimación**: S

- [x] `npm run lint`, `typecheck`, `test`, `test:cov` (≥90 %), `test:e2e` en `apps/backend` → verde sin credenciales reales.
- [x] Confirmar que la spec SC-011 (HTTP no-OK logueado) pasa y no rompe los SC-004/005/006/007/008 existentes.
- [x] `bash check-refs.sh` y `bash specboot.sh --ci` → 0 errores.
- [x] Grep final de `CATEGORIES_WEBHOOK_URL` y `ICategoryChangeNotifier` → 0 en código.

**Suggested Path**: no aplica (transversal)
**Test Path**: `apps/backend/src/catalog/`

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