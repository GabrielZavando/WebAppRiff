# Requirements — generalize-catalog-rebuild-webhook

1. **R1 — Puerto unificado `ICatalogChangeNotifier`.** Debe existir un puerto en
   `domain/` que acepte eventos de regeneración del catálogo tipados por entidad
   (`category | subcategory | product`), acción (`created | updated | deleted |
   published | unpublished`) e `occurredAt`. Reemplaza a `ICategoryChangeNotifier`
   (se elimina este último y su token). (SC-001…SC-003)
2. **R2 — Notifier por categorías.** `CategoriaService` notifica tras
   crear/actualizar/eliminar una categoría. (SC-001)
3. **R3 — Notifier por subcategorías.** `SubcategoriaService` notifica tras
   crear/actualizar/eliminar una subcategoría. (SC-002)
4. **R4 — Notifier por productos.** `ProductoWriteService` notifica tras
   crear/actualizar (incluye publicar/despublicar vía campo `publicado`) y
   eliminar un producto. (SC-003)
5. **R5 — Auth Bearer.** El transporte envía `Authorization: Bearer <token>` +
   `content-type: application/json`; el token se lee de
   `CATALOG_REBUILD_WEBHOOK_TOKEN`. (SC-004)
6. **R6 — Timeout.** La petición usa un timeout (p. ej. `AbortSignal.timeout(5000)`)
   y aborta sin bloquear la mutación. (SC-005)
7. **R7 — No-op sin URL.** Si `CATALOG_REBUILD_WEBHOOK_URL` no está, no se envía
   nada y no se lanza error. (SC-006)
8. **R8 — Fallo no bloqueante.** Fire-and-forget: la mutación termina con éxito
   aunque el webhook falle; el error se registra como warning. (SC-007)
9. **R9 — Sin secretos en logs.** Warning/error logueados sin token ni URL
   completa; con tipo/acción de la entidad. (SC-008)
10. **R10 — Env migrada.** `CATALOG_REBUILD_WEBHOOK_URL` +
    `CATALOG_REBUILD_WEBHOOK_TOKEN` en `.env.example` (raíz y backend) y en la
    tabla de `docs/deploy-standards.md`; `CATEGORIES_WEBHOOK_URL` eliminada de
    código y docs (grep confirma 0 consumidores). (SC-009)
11. **R11 — Suite verde.** Backend lint/typecheck/test/cov(≥90%)/e2e pasan;
    contract tests del puerto y specs del notifier verdes. (SC-010)
12. **R12 — No-silent-failure HTTP.** El transporte inspecciona `response.ok`
    tras el `fetch`; si es `false` (4xx/5xx) loguea un warning con el status HTTP
    y entityType/action, sin token ni URL, y no lanza a la mutación. (SC-011)