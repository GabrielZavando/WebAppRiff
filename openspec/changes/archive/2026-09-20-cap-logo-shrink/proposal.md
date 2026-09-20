# Proposal — cap-logo-shrink

**Ticket ID**: LOGO-SIZE
**Tag**: [frontend]
**Title**: Acotar el shrink del logo del header (mín. 100px alto desktop)
**Enriched source**: openspec/tickets/LOGO-SIZE-enriched.md

## Why

Hoy el logo del header baja a `max-width: 200px` en desktop al hacer scroll (≈81px de alto con el asset 330×134), lo que se percibe como "demasiado chico" y debilita la presencia de marca durante la navegación. El pedido del cliente (LOGO-SIZE) es acotar ese encogimiento: en desktop el logo reducido debe tener un alto mínimo de 100px con ancho automático.

El shrink es 100% CSS (`apps/web/src/styles/header-scroll.css`, regla dentro de `@media (min-width: 640px)` para `body[data-scrolled='true'] .site-logo`). El toggle `data-scrolled` lo hace `createHeaderScrollState.ts`, que NO se modifica.

## What Changes

In scope:
- Ajustar la regla CSS del estado compacto desktop del logo en `apps/web/src/styles/header-scroll.css` para garantizar alto renderizado ≥ 100px con ancho automático (el alto es el contrato; si la implementación usa `max-width`, documentar el razonamiento en el comentario).
- Actualizar (TDD/RED primero) el test E2E desktop en `apps/web/e2e/site-header-scroll.spec.ts` dejará de assertar `max-width: 200px` y verificará el comportamiento de alto ≥ 100px.
- Mantener intactos: comportamiento mobile (150px), fondo navy del estado compacto, sombra del sticky shell, `prefers-reduced-motion`, threshold de scroll, y `createHeaderScrollState.ts`.

Out of scope:
- Cambios de alto mínimo en mobile (por defecto no aplica; pendiente de confirmación del cliente).
- Cambios en el asset del logo, Header.astro (salvo evidencia de necesidad), backend, API o data model.
- Cambios en el mecanismo binario de estado de scroll.

## Impact

- Specs afectadas: comportamiento visual del header en estado compacto (desktop) — sin specs OpenSpec previas en `openspec/specs/` para esta regla; se documenta como capacidad `site-header-scroll`.
- Código: `apps/web/src/styles/header-scroll.css`, `apps/web/e2e/site-header-scroll.spec.ts`.
- Breaking changes: ninguno (valor visual distinto; test E2E actualizado acorde).
