# Scenarios — generalize-catalog-rebuild-webhook

> Nota de validación de diseño: entidades reales de `docs/data-model/data-model.md`
> (`categorias`, `subcategorias`, `productos`). No dependen de endpoints nuevos de
> api-spec.yml (el webhook es saliente al deploy, no una ruta del API).

### SC-001: Regeneración por cambio de categoría (AC5)
**Given** un cambio en una categoría (crear, actualizar o eliminar)
**When** la mutación de `CategoriaService` termina correctamente
**Then** se envía un evento `catalog.rebuild` al webhook configurado con tipo `category`, id, acción y `occurredAt`
**And** la operación principal (201/200/204) no espera ni depende del webhook

### SC-002: Regeneración por cambio de subcategoría (AC5)
**Given** un cambio en una subcategoría (crear, actualizar o eliminar)
**When** la mutación de `SubcategoriaService` termina correctamente
**Then** se envía un evento con tipo `subcategory` al webhook
**And** la mutación responde sin bloquearse por el webhook

### SC-003: Regeneración por cambio de producto (AC5)
**Given** un cambio en un producto: crear, actualizar (incluye publicar/despublicar por el campo `publicado`) o eliminar
**When** la mutación de `ProductoWriteService` termina correctamente
**Then** se envía un evento con tipo `product` y la acción correspondiente
**And** la mutación responde sin bloquearse por el webhook

### SC-004: Autenticación Bearer (AC6)
**Given** el webhook está configurado con URL y token
**When** el notifier envía el evento
**Then** la petición HTTP incluye el header `Authorization: Bearer <token>` y `content-type: application/json`
**And** el token nunca aparece en logs ni en el cuerpo del request

### SC-005: Timeout en la petición
**Given** el webhook tarda demasiado en responder
**When** el notifier envía el evento
**Then** la petición se aborta tras el timeout configurado (sin bloquear la mutación)
**And** el error de timeout se loguea como warning sin token ni URL sensible

### SC-006: No-op cuando no está configurado
**Given** `CATALOG_REBUILD_WEBHOOK_URL` no está definido
**When** ocurre una mutación de catálogo
**Then** el notifier no envía nada y la mutación procede normalmente (sin error)

### SC-007: Fallo del webhook no rompe la mutación
**Given** el webhook devuelve error (o no responde)
**When** ocurre una mutación de catálogo
**Then** la mutación del catálogo termina con éxito (el error se registra como warning, no propaga)

### SC-008: Sin secretos en logs
**Given** el notifier registra errores
**When** se emite un warning
**Then** el mensaje no contiene el token (`CATALOG_REBUILD_WEBHOOK_TOKEN`) ni la URL completa
**And** se identifica el tipo de entidad/acción afectada

### SC-009: Env vars migradas
**Given** un entorno nuevo configurado con `.env.example`
**When** el operador lee las variables de deploy/backend
**Then** encuentra `CATALOG_REBUILD_WEBHOOK_URL` y `CATALOG_REBUILD_WEBHOOK_TOKEN`
**And** `CATEGORIES_WEBHOOK_URL` ya no existe ni aparece en código ni docs

### SC-010: Suite verde (backend-standards)
**Given** la suite completa del backend (`lint`, `typecheck`, `test`, `test:cov` ≥90 %, `test:e2e`)
**When** se ejecuta en CI sin credenciales reales
**Then** todos los checks pasan, incluidos los tests del nuevo notifier y los contract tests del puerto

### SC-011: Fallo HTTP del webhook se loguea (no-silent-failure)
**Given** el webhook responde con un status HTTP 4xx/5xx (p. ej. 401 o 500) — no un error de red/timeout
**When** el notifier envía el evento
**Then** `fetch` resuelve pero se inspecciona `response.ok`
**And** si `response.ok` es `false`, se emite un warning con el status HTTP y el tipo/acción, sin token ni URL
**And** la mutación del catálogo termina con éxito (el error no se propaga)