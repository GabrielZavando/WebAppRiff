# Proposal: Generalize catalog rebuild webhook (CATALOG_REBUILD_* + Bearer + timeout + subcategory/product)

- **Ticket ID**: RIFF-DEPLOY-01 (Change B del plan de despliegue)
- **Título original**: "[backend] Corregir la regeneración del catálogo Astro"
- **Tag**: `[backend]`
- **Change name**: `generalize-catalog-rebuild-webhook`

## Motivación

El backend hoy regenera el sitio Astro tras un cambio de **categoría** mediante
`WebhookCategoryChangeNotifier`, que envía a `CATEGORIES_WEBHOOK_URL` por POST sin
autenticación ni timeout. El ticket exige:

- Reemplazar el concepto específico `CATEGORIES_WEBHOOK_URL` por uno que represente
  **todo el catálogo**: `CATALOG_REBUILD_WEBHOOK_URL` + `CATALOG_REBUILD_WEBHOOK_TOKEN`.
- Regenerar Astro cuando cambie cualquier dato **público** del catálogo:
  categorías, subcategorías (create/update/delete) y productos
  (create/update/publish/unpublish/delete).
- Autenticación **Bearer** con el token, **timeout**, fire-and-forget que no
  bloquee la mutación (la operación principal termina aunque Coolify falle), y
  errores logueados **sin** exponer token ni URL.
- Seguridad (backend-standards): nunca loguear credenciales; DIP — el notifier es
  un puerto en `domain/` inyectado desde `infrastructure/`.

Estado actual:
- `CATEGORIES_WEBHOOK_URL` es una sola variable (deploy-standards.md y `.env.example`).
- El notifier solo cubre categorías (`icategory-change-notifier.ts`, token
  `I_CATEGORY_CHANGE_NOTIFIER`), inyectado solo en `categorias.module`.
- `subcategoria.service` (create/update/remove) y `producto-write.service`
  (create/update/remove) no notifican nada.

## Decisión de diseño

1. **Puerto unificado `ICatalogChangeNotifier`** en `domain/` con un evento
   tipado que identifica el tipo de entidad (`category | subcategory | product`),
   su id, la acción (`created | updated | deleted | published | unpublished`) y
   `occurredAt`. Reemplaza a `ICategoryChangeNotifier` (migración del consumidor
   actual).
2. **Transporte `WebhookCatalogChangeNotifier`** en `infrastructure/`: lee
   `CATALOG_REBUILD_WEBHOOK_URL` + `CATALOG_REBUILD_WEBHOOK_TOKEN`, hace `POST`
   con header `Authorization: Bearer <token>` y `content-type: application/json`,
   con timeout (p. ej. `AbortSignal.timeout(5000)`). **No-op** cuando la URL no
   está configurada; **fire-and-forget** (nunca lanza a la mutación); logs con
   `String(error)` que no incluyen el token.
3. **Inyección en los 3 módulos** (categorías, subcategorías, productos): el
   provider `I_CATALOG_CHANGE_NOTIFIER` se exporta desde un módulo compartido (p.
   ej. `CategoriasModule` o un módulo nuevo) y se inyecta en los services, que
   llaman `notifyChange(...)` tras cada mutación.
4. **Env/deps/docs**: `CATEGORIES_WEBHOOK_URL` → `CATALOG_REBUILD_WEBHOOK_URL` +
   `CATALOG_REBUILD_WEBHOOK_TOKEN`. Actualizar `.env.example` (raíz/backend) y la
   tabla de variables de `docs/deploy-standards.md`. Los valores se guardan como
   secretos de NestJS en Secret Manager (ops manual).

## Alcance

- Backend: nuevo puerto/notifier, migración de `categoria.service` a
  `ICatalogChangeNotifier`, e inyección en `subcategoria.service` y
  `producto-write.service`.
- Env y docs de contrato.

## Fuera de alcance

- Crear los secretos en Secret Manager (ops manual).
- Smoke tests de frontends completos y rollback extendido (Change C).
- Ajustes del pipeline de deploy (Change A, ya archivado).

## Riesgos

- **Multi-mutación**: un solo cambio puede tocar categoría + subcategoría +
  producto (p. ej. al editar un producto con categoría nueva). Se notificará por
  cada mutación; Coolify/webhook debe ser idempotente (rebuild completo).
- **Fallo silencioso**: fire-and-forget oculta errores de red; se loguean como
  `warn` con contexto sin secretos.
- **Retrocompatibilidad**: `CATEGORIES_WEBHOOK_URL` se elimina; garantizar que
  no quede ningún consumidor tras la migración (grep).