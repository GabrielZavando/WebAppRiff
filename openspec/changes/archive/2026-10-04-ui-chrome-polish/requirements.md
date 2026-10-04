# Requirements — ui-chrome-polish

1. **R1 — Padding del header formalizado.** `<header class="site-header">` porta
   `pb-10 lg:pb-4` (decisión del cliente); `Header.test.ts` (+ snapshot), el
   comentario interno del componente y la spec `site-header` quedan alineados;
   overflow leve del logo 2× en desktop aceptado, móvil sigue conteniendo el
   logo completo. (SC-001)
2. **R2 — Buscador con fondo uniforme.** El wrapper `role="search"`
   (`.site-search`) renderiza exactamente dos estados de reposo: `bg-transparent`
   (páginas con hero: `/`, `/servicios`) y `bg-secondary` sólido —
   `var(--color-secondary)` — (resto: `/productos`, `/productos/{slug}`, fallback
   404), color uniforme en todas las páginas con buscador (referencia: Inicio);
   sin gradiente `from-secondary to-secondary-light`, sin variante blanca
   `bg-white border-b border-border`, sin hex literal, y sin plumbing
   `secondaryBg`/`searchSecondary`. (SC-002, SC-003)
3. **R3 — Estado compacto de scroll preservado.** `body[data-scrolled='true']
   .site-search` sigue transicionando a `var(--color-secondary)` (300ms) y
   `prefers-reduced-motion` desactiva la transición; `header-scroll.css` no se
   modifica. (SC-004)
4. **R4 — Panel elevado en desktop.** El `<section>` de PanelHome porta `-mt-2`
   uniforme (desktop pasa de +8px a −8px: 16px más cerca del top); móvil/tablet
   intactos (−8px); `z-10` y el overlap con el hero preservados. (SC-005)
5. **R5 — Enlace "Nosotros" en el menú.** `NAVIGATION_ITEMS` incluye
   `{ label: 'Nosotros', href: '/nosotros' }` (tras "Inicio"); ambas navs del
   Header (desktop y móvil) lo renderizan desde la misma lista y reciben estado
   activo (`aria-current="page"`) al visitar `/nosotros`. (SC-006)
6. **R6 — Botón flotante de WhatsApp global.** `<WhatsAppButton />` integrado
   una sola vez en `Layout.astro`: `<a>` fijo `bottom-6 right-6 z-20` (sobre el
   contenido ≤ `z-10`, bajo el grupo sticky `z-30` y su overlay del menú móvil —
   fix post-adversarial), solo
   icono (`simple-icons:whatsapp`), `href="https://wa.me/56937526162"` (+56 9
   3752 6162 → solo dígitos), `target="_blank"`, `rel="noopener noreferrer"`,
   tokens `--color-whatsapp` (#25D366) / `--color-whatsapp-dark` (hover)
   declarados en los `globals.css` de ambas apps (paridad design-tokens),
   sin hex crudo en el componente. (SC-007)
7. **R7 — Accesibilidad del botón WhatsApp.** `aria-label="Contactar por
   WhatsApp"`, icono con `aria-hidden="true"`, foco visible, sin etiqueta de
   texto con el número, visible sobre el contenido y bajo el overlay del menú
   móvil (z-30 < z-40); excepción de icono documentada en el catálogo canónico
   (`docs/design/style-guide/README.md`, precedente `simple-icons:x`). (SC-008)
