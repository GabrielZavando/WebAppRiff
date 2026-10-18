# Design

## Context

Ver `proposal.md - Why` para la motivación. Restricciones que moldean el diseño:

- El sitio público es **Astro 7 SSG puro** (`apps/web/astro.config.mjs`,
  `output: 'static'`) servido por nginx dentro de un contenedor Docker en Coolify;
  no hay runtime Node ni CDN que invalide contenido.
- El backend ya emite `emitChange` en cada create/update/delete de producto,
  categoría y subcategoría, y ya existe el notificador por webhook
  (`apps/backend/src/catalog/infrastructure/webhook-catalog-change-notifier.ts`),
  hoy no-op cuando falta configuración.
- El endpoint `GET /api/v1/products` ya expone paginación `page`/`limit`
  (default 24, máx 100) y `meta.total` en la envoltura `{ data, error, meta }`
  (`apps/backend/src/productos/infrastructure/producto.controller.ts`).
- En staging, `CATALOG_REBUILD_WEBHOOK_URL`/`_TOKEN` están deliberadamente sin
  configurar (no-op confirmado en el runbook y en
  `openspec/changes/archive/2026-10-13-backend-staging-deploy/design.md`).

## Goals / Non-Goals

**Goals:**
- Que una edición en el admin se refleje en el catálogo público de staging vía
  rebuild del sitio (Opción 1).
- Que el build hornee el **universo completo** de productos publicados y el
  catálogo pagine sobre él.
- Que la ausencia de configuración del webhook deje de ser un fallo silencioso.

**Non-Goals:**
- No se cambia el hosting del sitio (sigue nginx estático en Coolify).
- No se cambia el modelo de datos ni las reglas de Firestore.
- No se implementa SSR (Opción 2) ni islas con Firestore directo (Opción 3).

## Decisions

### D1 — Opción 1 (SSG + rebuild por webhook), no SSR ni islas

Se adopta **SSG + rebuild disparado por webhook** como solución equilibrada
para "cambios visibles sin perder SEO".

| Criterio | O1 SSG + rebuild (elegida) | O2 SSR puro | O3 Islas + Firestore directo |
| --- | --- | --- | --- |
| SEO | Óptimo: HTML estático indexable sin JS | Bueno, pero TTFB depende de compute/cold start | Se preserva solo si igual se mantiene el SSG; los cambios en vivo no se indexan |
| Complejidad | Baja: no se toca el front salvo la carga de datos | Media-Alta: adapter Node y cambio de hosting | Alta: framework island + SDK Firebase + doble ruta de datos |
| Paginación 70 | Trivial: paginar el build y hornear todos | Query server-side por request | Query cliente + `onSnapshot` por página; "total en vivo" costoso |
| Mantenibilidad | Alta: funciones puras intactas | Alta: una sola fuente de verdad (BFF) | Baja: dos fuentes de verdad; `onSnapshot` difícil de testear |
| Costo/CWV | Bajo; sin JS de framework en el catálogo | Medio | Alto: lecturas de Firestore por snapshot × visitante; peso JS |

**Alternativas consideradas y por qué no ahora:**
- **Opción 2 (SSR puro)**: requeriría `output: 'server'` + `@astrojs/node`,
  reemplazar nginx por runtime Node y asumir TTFB/cold starts. Queda documentada
  como escape futuro si se necesita contenido "siempre fresco" sin rebuild.
- **Opción 3 (Islas Astro + Firestore client SDK `onSnapshot`)**: fue evaluada y
  **descartada**. Requeriría revertir el *lockdown* de Firestore
  (`apps/backend/firestore.rules` con `allow read, write: if false`, especificado
  en `openspec/specs/firebase-infra-config/spec.md`), abrir lectura pública por
  documento, saltarse el BFF (proyección `card`, saneo y envoltura) y asumir costo
  de lecturas real-time proporcional al tráfico. Su aporte (refresco en vivo
  mientras un visitante mira) no justifica esas regresiones en un catálogo B2B con
  ediciones internas infrecuentes.

### D2 — Carga build-time del universo completo vía `meta.total`

`getPublicProducts()` dejará de hacer una sola llamada sin paginar. Pedirá
páginas con `limit=100` (máximo del API) y usará `meta.total` para saber cuándo
detenerse, acumulando todos los productos publicados en el array cacheado a
nivel de módulo. El tipo de respuesta incorporará `meta`.

Alternativas consideradas:
- **Subir `DEFAULT_LIMIT` del backend**: no escala y rompe el contrato de
  paginación documentado en `api-products-pagination`; descartado.
- **Endpoint "all"**: añade superficie de API para un caso que la paginación ya
  cubre; descartado por ahora.

Paginación de presentación (9 por página) y paginación de transporte (100) quedan
como conceptos separados: `applyProductFilters` sigue siendo la única fuente de
verdad del render en cliente, ahora sobre el universo completo.

### D3 — No-op observable en el notificador

`WebhookCatalogChangeNotifier.notifyChange` emitirá `Logger.warn` cuando falte
la URL o el token, indicando qué variable falta y sin incluir valores. El `warn`
ocurre una vez por evento (fire-and-forget), no bloquea ni falla la mutación.
Alternativa considerada: fallar la mutación o el arranque del servicio — rechazada,
porque el contrato actual exige que una mutación nunca dependa del webhook.

### D4 — Configuración del webhook en staging y runbook

El webhook apunta al deploy hook de **Coolify** del recurso `web-staging`. En Cloud
Run `riff-api-staging` se inyectan `CATALOG_REBUILD_WEBHOOK_URL` y
`CATALOG_REBUILD_WEBHOOK_TOKEN` (Bearer). El runbook
`docs/runbooks/backend-staging-cloud-run.md` documentará cómo crear el webhook en
Coolify y cómo pasarlo al servicio. Producción queda fuera de alcance de este
change (su lane se activa cuando existan sus propias variables).

## Risks / Trade-offs

- **El rebuild de Coolify tarda (build completo de Astro)**: no es tiempo real;
  la propagación visible es de minutos. → Aceptable para catálogo B2B; el mensaje
  del runbook lo explicita.
- **Bucle de rebuild**: el deploy del front no muta catálogo, por lo que no hay
  realimentación; no se esperan rebuilds en cascada.
- **Paginación con páginas inconsistentes durante el build** (mutación mientras se
  pagina): el universo podría quedar levemente desalineado. → Bajo impacto; el
  siguiente rebuild lo corrige.
- **Fallo del webhook no se reintenta**: es fire-and-forget. → Se mitiga con el
  `warn` observable (D3); reintentos quedan fuera de alcance.
- **`meta.total` con productos no publicados**: el total público solo cuenta
  publicados. → Es el comportamiento deseado; se documenta en la spec.

## Migration Plan

1. Backend: añadir el `warn` del no-op y cubrirlo con tests; desplegar a staging.
2. Web: paginar la carga y hornear el universo completo; desplegar vía Coolify.
3. Ops: crear el webhook en Coolify, inyectar `CATALOG_REBUILD_*` en Cloud Run y
   verificar el ciclo editar → rebuild → título actualizado.
4. Rollback: revertir el commit y redesplegar; el no-op vuelve a su estado previo
   sin efectos de datos.

## Open Questions

- Confirmar la URL exacta y el token del deploy webhook del recurso `web-staging`
  en el panel de Coolify al momento de configurar (depende del entorno, no cambia
  el diseño ni las specs).
- Decidir si producción activa su webhook en un change posterior (fuera de alcance).
