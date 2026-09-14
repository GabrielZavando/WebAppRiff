# Design — generalize-catalog-rebuild-webhook

## Contexto

`WebhookCategoryChangeNotifier` (en `categorias/infrastructure/`) notifica solo
cambios de categoría a `CATEGORIES_WEBHOOK_URL` por POST sin auth ni timeout. El
ticket exige regenerar Astro ante cambios en todo el catálogo (categorías,
subcategorías, productos) con un webhook autenticado por Bearer y time-bounded, y
reemplazar `CATEGORIES_WEBHOOK_URL` por `CATALOG_REBUILD_*`.

## Decisión de diseño

### 1. Puerto unificado `ICatalogChangeNotifier`

Ubicado en `catalog/domain/` (nuevo módulo transversal) o reutilizando
`categorias/domain/`. Tipos:

```ts
type CatalogEntityType = 'category' | 'subcategory' | 'product';
type CatalogChangeAction = 'created' | 'updated' | 'deleted' | 'published' | 'unpublished';
interface CatalogChangeEvent {
  entityType: CatalogEntityType;
  id: string;
  action: CatalogChangeAction;
  occurredAt: string; // ISO-8601
}
interface ICatalogChangeNotifier {
  notifyChange(event: CatalogChangeEvent): void | Promise<void>;
}
const I_CATALOG_CHANGE_NOTIFIER = 'I_CATALOG_CHANGE_NOTIFIER';
```

`ICategoryChangeNotifier` y su token se eliminan; `categoria.service` migra al
nuevo puerto.

### 2. Transporte `WebhookCatalogChangeNotifier`

```ts
@Injectable()
class WebhookCatalogChangeNotifier implements ICatalogChangeNotifier {
  private readonly logger = new Logger(WebhookCatalogChangeNotifier.name);
  notifyChange(event: CatalogChangeEvent): void {
    const url = process.env[REBUILD_URL_ENV];
    const token = process.env[REBUILD_TOKEN_ENV];
    if (!url || !token) return;
    void this.dispatch(url, token, event);
  }
  private async dispatch(url, token, event) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(event),
        signal: AbortSignal.timeout(5000),
      });
    } catch (err) {
      this.logger.warn(`[catalog-rebuild] failed for ${event.entityType}/${event.action}: ${String(err)}`);
    }
  }
}
```

- No-op si falta URL **o** token → conserva el no-op actual y exige token para
  autenticar (SC-006/SC-004).
- Fire-and-forget; timeout `AbortSignal.timeout(5000)` (SC-005).
- Logs con `String(error)` y solo tipo/acción, **sin** token ni URL (SC-008).

### 3. Inyección en los servicios

`CategoriasModule` proporciona `I_CATALOG_CHANGE_NOTIFIER` (useClass:
`WebhookCatalogChangeNotifier`) y lo exporta. `SubcategoriasModule` y
`ProductosModule` importan `CategoriasModule` (o un módulo compartido) y lo
consumen:

- `CategoriaService` (create/update/remove) → `entityType:'category'`
- `SubcategoriaService` (create/update/remove) → `entityType:'subcategory'`
- `ProductoWriteService` (create/update/remove; update detecta publish/unpublish
  comparando `publicado`) → `entityType:'product'`

`notifyChange` se invoca tras el éxito de la escritura, sin `await` (fire-and-forget).

## Archivos clave

- `apps/backend/src/catalog/domain/icatalog-change-notifier.ts` (+ contract spec)
- `apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts` (+ spec)
- `categorias/{module, application/categoria.service}` ; `subcategorias/*` ;
  `productos/application/producto-write.service.ts` + `productos.module.ts`
- `.env.example` (raíz/backend), `docs/deploy-standards.md`

## Riesgos / mitigaciones

- Publicar/despublicar = update del campo `publicado`: `ProductoWriteService.update`
  detecta el delta y emite `published`/`unpublished`; si no cambia `publicado`,
  emite `updated`.
- El webhook debe soportar múltiples eventos por cambio (idempotente / full rebuild).
- Dos secretos de NestJS en Secret Manager (ops, fuera de alcance) — el no-op
  mantiene el comportamiento local intacto hasta que se configuren.