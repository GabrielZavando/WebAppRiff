## Why

Tres ajustes menores de contenido y navegación solicitados por el cliente para el sitio público Astro (`apps/web`): (1) el correo mostrado debe ser `contacto@somosriff.cl` en todos los lugares donde aparece (hoy `contacto@riff.cl` en la barra de contacto de /contacto y en el fallback mailto de la ficha de producto); (2) las tarjetas de "Servicios especializados" del home deben llevar a /servicios con scroll suave hasta la tarjeta del servicio respectivo, aprovechando las View Transitions de Astro; (3) los botones "Cotizar" de "Soluciones Destacadas" deben decir "Ver detalles" y enlazar a la ficha de detalle del producto. Origen: ticket `feat/web-home-contact-tweaks`, enriquecido en `openspec/tickets/feat-web-home-contact-tweaks-enriched.md` (respuestas del cliente confirmadas 2026-09-30).

## What Changes

- **Correo único** (SC-001, SC-004): `contacto@somosriff.cl` reemplaza `contacto@riff.cl` en `apps/web/src/lib/config/contact-page.ts` (ContactBar de /contacto) y en el fallback `mailto` de `apps/web/src/pages/productos/[slug].astro`; se corrige además el comentario desactualizado sobre /cotizacion (que no muestra email) y el ejemplo de JSDoc en `lib/types/contact-form.ts`.
- **Scroll suave con View Transitions** (SC-002, SC-005–SC-008): se activa `<ClientRouter />` globalmente en `apps/web/src/layouts/Layout.astro`, se adapta `initHeaderScrollState` para re-inicializar en `astro:page-load`, se añade `slug` a `ServicePageService` + anclas `id` con `scroll-margin-top` en `ServiceCard`, y los CTAs de las tarjetas de servicios del home pasan a apuntar a `/servicios#{slug}` (el campo `href` de `Service` se elimina por redundante — single source = slug).
- **"Ver detalles" en Destacados** (SC-003): el texto del CTA de tarjeta de `DestacadosSection` cambia de "Cotizar" a "Ver detalles" (el href ya apuntaba a `/productos/{slug}`). **Fix post-verificación (decisión del cliente 2026-09-30)**: se alinean los slugs de `FEATURED_PRODUCTS` con el catálogo publicado (`antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre`, `medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo`) y se reemplazan los 2 productos no publicados ("MWN Woltman", "Flujómetro Universal") por 2 publicados ("Medidor de Flujo Riff Turbine Pro", "Medidor Electromagnético Fullmag HA"), con imágenes provisionales reutilizadas pendientes de fotos reales del cliente.

**Out of scope**: botones "Cotizar" del catálogo (`ProductCard`/`ProductListItem`), correos placeholder de formularios (`correo@empresa.com`, `juan.perez@empresa.com`), migración a CMS (`contentful-from-cms`).

## Capabilities

### New Capabilities

- `view-transitions`: ClientRouter global en Layout, header scroll-state resiliente a navegaciones client-side (`astro:page-load`), y scroll suave a anclas con degradación (`prefers-reduced-motion` / navegadores sin soporte VT → MPA nativa).

### Modified Capabilities

- `contact-page`: el email mostrado y enlazado por el ContactBar pasa a `contacto@somosriff.cl`.
- `product-detail-page`: el fallback `mailto` de la CTA "CONTACTAR ASESOR" pasa a `contacto@somosriff.cl`.
- `services-section`: los CTAs de tarjeta apuntan a `/servicios#{slug}` (derivado del slug en el componente; campo `href` de `Service` eliminado por redundante).
- `services-page`: las `ServiceCard` llevan ancla `id={slug}` estable (1:1 con los slugs del home) con `scroll-margin-top`.
- `destacados-section`: el CTA de tarjeta pasa de "Cotizar" a "Ver detalles" (exacto).

## Impact

- Archivos afectados:
  - `apps/web/src/lib/config/contact-page.ts` (email + comentario stale)
  - `apps/web/src/pages/productos/[slug].astro` (mailto fallback)
  - `apps/web/src/lib/types/contact-form.ts` (ejemplo JSDoc)
  - `apps/web/src/lib/types/services-page.ts` + `apps/web/src/lib/config/services-page.ts` (slug por servicio)
  - `apps/web/src/components/ServiceCard.astro` (ancla `id` + scroll-margin)
  - `apps/web/src/components/ServicesSection.astro` (CTA → `/servicios#{slug}`)
  - `apps/web/src/lib/types/services-section.ts` + `apps/web/src/lib/config/services-section.ts` (campo `href` eliminado)
  - `apps/web/src/components/DestacadosSection.astro` (texto CTA)
  - `apps/web/src/layouts/Layout.astro` (`<ClientRouter />`)
  - `apps/web/src/lib/scroll/createHeaderScrollState.ts` (re-init en `astro:page-load`)
- Tests afectados (deben actualizarse antes de codear, TDD):
  - `apps/web/src/lib/config/__tests__/contact-page.test.ts` (aserciones `contacto@riff.cl`, líneas 50/52)
  - `apps/web/src/pages/__tests__/contacto.test.ts` (línea 33)
  - `apps/web/src/components/__tests__/ContactBar.test.ts` (líneas 35-36/119) + snapshot
  - `apps/web/src/pages/productos/__tests__/[slug].test.ts` (línea 127)
  - `apps/web/src/components/__tests__/DestacadosSection.test.ts` (aserción "Cotizar", líneas 226-239)
  - `apps/web/src/components/__tests__/ServicesSection.test.ts` + `helpers/services-section-test-utils.ts` (aserciones `href="/servicios"`)
- Nuevos tests: contrato 1:1 slugs↔anclas; ClientRouter en Layout; re-init de scroll-state en `astro:page-load`.
- Sin cambios de API, data model ni dependencias nuevas (Astro ya en 7.1.6; `<ClientRouter />` es built-in de `astro:transitions`).
