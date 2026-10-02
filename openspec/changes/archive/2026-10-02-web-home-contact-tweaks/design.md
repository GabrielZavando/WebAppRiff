# Design — web-home-contact-tweaks

> Derivado del artefacto enriquecido
> `openspec/tickets/feat-web-home-contact-tweaks-enriched.md` (respuestas del
> cliente confirmadas 2026-09-30). Capas afectadas: frontend.

## Diseño de Clases/Componentes

- `lib/config/contact-page.ts` (config): responsabilidad única = "coordenadas de contacto canónicas de /contacto" → `CONTACT_EMAIL`/`CONTACT_EMAIL_HREF` pasan a `contacto@somosriff.cl` / `mailto:contacto@somosriff.cl`; corregir el comentario desactualizado sobre `cotizacion.astro`.
  - Depende de: tipos `contact-form`; NO de componentes concretos. Capa: infrastructure (config SSG).
- `pages/productos/[slug].astro` (página): el fallback `mailto` del bloque CTA pasa a `contacto@somosriff.cl` (valor hardcodeado, mismo patrón actual).
  - Capa: infrastructure (página SSG).
- `ServicesSection.astro` (dumb): responsabilidad única = "renderizar la sección de servicios del home" → CTA por tarjeta apunta a `/servicios#${service.slug}` (deriva del `slug` ya existente en `Service`).
  - Depende de: `ServicesSectionProps`; NO de la página /servicios. Capa: dumb.
- `ServicePageService` + `lib/config/services-page.ts` (contrato + config): añadir campo `slug` (kebab-case, 1:1 con los slugs del home) para anclas estables.
  - Capa: infrastructure.
- `ServiceCard.astro` (dumb): renderizar `id={slug}` en el `<article>` raíz (target de ancla) + `scroll-margin-top` para compensar el header sticky.
  - Depende de: `ServiceCardProps`; NO del home. Capa: dumb.
- `Layout.astro` (layout compartido): añadir `<ClientRouter />` (Astro 7 — View Transitions) en `<head>`; adaptar `initHeaderScrollState` para re-inicializar en `astro:page-load`.
  - Capa: infrastructure (layout compartido).
- `DestacadosSection.astro` (dumb): texto del CTA de tarjeta `"Cotizar"` → `"Ver detalles"` (un solo uso, texto ya inline en el componente).
  - Capa: dumb.

## Decisiones

1. **Correo único en los 2 lugares de producción** (confirmado por el cliente): `contact-page.ts` + fallback `mailto` de `[slug].astro`. `/cotizacion` verificado sin email (solo teléfono vía `CotizacionSupport`) — el comentario de `contact-page.ts` que afirma lo contrario está stale y se corrige.
2. **Anclas via slug** (single source of truth): el home ya tiene `slug` por servicio en `SERVICES_DATA`; se añade el mismo campo a `ServicePageService` y `ServiceCard` renderiza `id={slug}`. Los CTAs del home derivan el href del slug: `/servicios#${slug}`.
3. **Campo `href` de `Service` eliminado** (redundante): con el CTA derivado del slug, el campo `href: '/servicios'` genérico queda muerto. Se elimina del tipo + config (consumo contenido en `ServicesSection.astro` + tests, todos en el alcance del change) respetando "No duplicar estado: single source of truth" (base-standards). El `slug` pasa a ser el único identificador de destino.
4. **ClientRouter global + scroll-state resiliente**: `<ClientRouter />` (import de `astro:transitions`) en el `<head>` de `Layout.astro` activa View Transitions en todo el sitio (confirmado por el cliente). Regresión conocida: `initHeaderScrollState` se inicializa una vez vía script import — debe escuchar `astro:page-load` para re-vincular tras navegaciones client-side. Los listeners inline del menú móvil (Header) deben re-vincularse igualmente.
5. **"Ver detalles" inline en `DestacadosSection`**: un solo uso, texto ya hardcodeado en el componente (alternativa `ctaLabel` en `FeaturedProduct` descartada por minimalismo).
6. **Smooth scroll gated por accesibilidad**: el scroll suave a anclas se gatea con `@media (prefers-reduced-motion: no-preference)`; Astro respeta reduced-motion en View Transitions por defecto. Navegadores sin soporte VT → fallback MPA nativo con hash scrolling.
7. **Slugs de Destacados alineados al catálogo publicado (fix post-verificación, decisión del cliente 2026-09-30)**: la verificación 7.3 reveló que los 4 slugs de `FEATURED_PRODUCTS` daban 404 (2 productos existían con slugs SEO distintos; 2 no estaban publicados). Se alinean los 2 existentes (`antiincrustante-bimaks-420-para-osmosis-inversa-agua-salobre`, `medidor-ultrasonico-doppler-portatil-fullsonic-no-invasivo`) y se reemplazan los 2 no publicados por productos publicados: "Medidor de Flujo Riff Turbine Pro" (`medidor-de-flujo-riff-turbine-pro`, perfil turbina ≈ Woltman) y "Medidor Electromagnético Fullmag HA" (`medidor-electromagnetico-fullmag-ha`). **Imágenes provisionales**: se reutilizan las fotos locales liberadas de los productos reemplazados (`MWN-DN50.webp` → Riff Turbine Pro, `flujometro-multiproposito.webp` → Fullmag HA) con `imagenAlt` descriptivo de la foto; quedan pendientes las fotos reales del cliente (señalado en comentario de la config).

## Trade-offs / Riesgos

- La activación global de `<ClientRouter />` es cross-cutting: afecta la navegación de todas las páginas y todos los listeners JS existentes (header scroll state, menú móvil, SearchForm). Mitigación: adaptar a `astro:page-load` + suite completa de Vitest + verificación manual (tasks 5.3, 6.2, 7.1).
- Los tests de render completo (string matching sobre HTML) pueden romperse con el router client-side — snapshot de ContactBar y tests de Layout se revisan en fase roja.
- El mapeo slug↔ancla es un contrato implícito entre dos configs (`SERVICES_DATA` y `SERVICIOS_PAGE_SERVICES`): se cubre con un test de contrato 1:1 (task 1.5) para que un drift falle en CI, no en producción.

## Alternativas descartadas

- **Scroll suave solo-CSS** (`scroll-behavior: smooth` + anclas, sin ClientRouter): el ticket pide explícitamente View Transitions (confirmado por el cliente); queda como fallback automático para navegadores sin soporte.
- **Cambiar el correo solo en /contacto**: el usuario amplió el alcance a todos los lugares donde se muestra el correo (SC-004).
- **Añadir `ctaLabel` a `FeaturedProduct`**: minimalismo (un solo uso, texto ya inline); viable si se prefiere simetría con `Service.ctaLabel`.
- **CTA href explícito en config** (`href: '/servicios#slug'` por servicio): descartada por duplicar slug/href — el slug ya es parte del contrato y la derivación en el componente dumb (template literal) no añade lógica de negocio (frontend-standards § "Frontmatter sin lógica de negocio no trivial").

## Pendientes futuros (documentados, fuera de este change)

- **SC-006/SC-007 sin evidencia automatizada**: la regla de View Transitions/scroll
  con `prefers-reduced-motion` (salto instantáneo) y el fallback MPA en navegadores
  sin soporte VT son comportamientos browser-only. Hoy SC-006/SC-007 quedan
  `UNTESTED` en `/verify` por diseño. Un e2e de Playwright con
  `page.emulateMedia({ reducedMotion: 'reduce' })` los cubriría; se aceptan como
  QA manual del cliente en navegador real (tarea 7.1, pre-commit).
- Nota: `globals.css:90` declara `scroll-behavior: smooth` global — es
  **preexistente** al change (no está en el diff) y no es parte del contrato de
  este change; el smooth-scroll del hash de `/servicios#{slug}` lo orquesta Astro
  al resolver el `#anchor` tras la transición. Si el cliente decide unificar la
  política global de reduced-motion (gatear con `@media
  (prefers-reduced-motion: no-preference)`), sería un change aparte que modifica
  tokens globales — backlog, análogo al sistema de productos destacados vía API
  (migración futura).
