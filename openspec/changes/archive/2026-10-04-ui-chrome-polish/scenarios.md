# Scenarios — ui-chrome-polish

> Validación de diseño: change solo frontend; no introduce entidades del data
> model ni endpoints de API. Conflictos menores documentados: el icono de
> WhatsApp requiere `simple-icons:whatsapp` (segunda excepción al set único
> Lucide, precedente `simple-icons:x`) y los tokens nuevos exigen paridad en
> ambas apps (`apps/admin/src/styles/__tests__/sync.test.ts`).
>
> Escenarios mapeados 1:1 del artefacto enriquecido
> (`openspec/tickets/UI-FIX1-enriched.md`), preservando sus IDs `SC-{NNN}`.

### SC-001: Header con padding-bottom `lg:pb-4` formalizado
**Given** el componente `Header.astro` ya editado a mano a `pb-10 lg:pb-4` (sin commit)
**When** se ejecuta la suite y se revisan tests/snapshot/spec
**Then** `<header class="site-header">` porta `pb-10 lg:pb-4` y el valor anterior `lg:pb-12` no aparece
**And** `Header.test.ts` (+ snapshot), el comentario interno del componente y la spec `site-header` reflejan el nuevo valor y la decisión del cliente (overflow leve del logo 2× en desktop aceptado; móvil sigue conteniendo el logo completo)

### SC-002: Buscador transparente en páginas con hero
**Given** las páginas `/` y `/servicios` renderizan el buscador sobre hero
**When** se renderiza el wrapper `role="search"` en estado de reposo
**Then** el elemento `.site-search` tiene fondo transparente (`bg-transparent`)
**And** el wrapper no lleva `bg-white`, `bg-secondary`, el gradiente `bg-linear-to-r from-secondary to-secondary-light` ni `border-b border-border`
**And** los campos input/select conservan `bg-white`

### SC-003: Buscador `var(--color-secondary)` en páginas sin hero (referencia Inicio)
**Given** las páginas `/productos` y `/productos/[slug]` (incl. fallback 404) renderizan el buscador sin hero
**When** se renderiza el wrapper `role="search"` en estado de reposo
**Then** el elemento `.site-search` tiene fondo sólido `bg-secondary` (var(--color-secondary)) — el mismo color activado que la página Inicio en su estado compacto
**And** sin gradiente `from-secondary to-secondary-light`, sin variante blanca `bg-white border-b border-border`, sin hex literal en los atributos `class`
**And** el plumbing `secondaryBg`/`searchSecondary` queda eliminado (prop, passthrough de Layout, tipo `SearchFormProps`, páginas que lo pasan)

### SC-004: Estado compacto de scroll del buscador se mantiene
**Given** la regla existente en `header-scroll.css` (`body[data-scrolled='true'] .site-search { background-color: var(--color-secondary) }`)
**When** el usuario hace scroll en cualquier página con buscador
**Then** el fondo transiciona a `var(--color-secondary)` (300ms; visualmente no-op en páginas no-hero)
**And** `prefers-reduced-motion` sigue desactivando la transición y `header-scroll.css` no se modifica

### SC-005: Card elevada del PanelHome 16px más arriba (solo desktop)
**Given** el `<section>` de `PanelHome.astro` con offset actual `-mt-2 md:-mt-2 lg:mt-2` (desktop +8px)
**When** se aplica la subida de 16px solo en desktop
**Then** el section porta `-mt-2` uniforme (desktop pasa de +8px a −8px: 16px más cerca del top)
**And** móvil/tablet quedan intactos (−8px), preservando `z-10` y el overlap con el hero

### SC-006: Página "Nosotros" alcanzable desde el menú
**Given** `apps/web/src/pages/nosotros.astro` ya existe (vacía, solo Header+Footer, `hero={false}`, `showSearch={false}`)
**When** se renderiza el menú de navegación (desktop o móvil)
**Then** `NAVIGATION_ITEMS` incluye `{ label: 'Nosotros', href: '/nosotros' }` (tras "Inicio") y el ítem se renderiza en ambas navs
**And** al visitar `/nosotros` el enlace recibe estado activo (`aria-current="page"`) vía `isActive`

### SC-007: Botón flotante de WhatsApp en todo el sitio
**Given** cualquier página del sitio (incl. 404 y páginas sin buscador)
**When** se renderiza el `Layout`
**Then** existe un botón flotante fijo en la esquina inferior derecha (`fixed bottom-6 right-6 z-30`) que enlaza a `https://wa.me/56937526162` (target `_blank`, `rel="noopener noreferrer"`), solo icono (sin etiqueta con el número)
**And** es visible sobre el contenido (≥ `z-10`) y bajo el grupo sticky del header (`z-30`) y su overlay del menú móvil (`z-20` < `z-30`; fix post-adversarial)
**And** persiste en todas las páginas (markup del Layout, sin JS extra) y usa los tokens `--color-whatsapp` / `--color-whatsapp-dark` sin hex crudo

### SC-008: Accesibilidad del botón WhatsApp
**Given** el botón flotante renderizado con el color de marca WhatsApp (token `--color-whatsapp`)
**When** un lector de pantalla o teclado lo recorre
**Then** es un `<a>` con `aria-label="Contactar por WhatsApp"` y foco visible
**And** el icono lleva `aria-hidden="true"` y no existe etiqueta de texto con el número

### Edge Cases

| Case | Expected Behavior | Cubierto por |
|------|-------------------|--------------|
| Menú móvil abierto | Overlay (z-40) tapa el botón (z-30); al cerrar vuelve a ser visible | SC-007 |
| Página 404 (`/productos/[slug]` no encontrado) | Botón WhatsApp visible (Layout compartido); buscador con fondo `bg-secondary` | SC-003, SC-007 |
| Páginas sin buscador (`/contacto`, `/cotizacion`, `/marcas`, `/nosotros`) | Regla `.site-search` vacua; botón WhatsApp visible | SC-004, SC-007 |
| Scroll en `/` y `/servicios` | Buscador transparente → `var(--color-secondary)` con transición 300ms | SC-004 |
| `prefers-reduced-motion` | Transiciones del buscador desactivadas (regla existente intacta) | SC-004 |
| Navegación con View Transitions | Botón WhatsApp persiste (markup del Layout, sin JS extra) | SC-007 |
| Logo 2× en desktop con `lg:pb-4` | Overflow visual leve aceptado por el cliente; spec del site-header relajada | SC-001 |
| Breakpoint de la subida del panel | Solo desktop (`lg:`); móvil/tablet conservan el offset actual (−8px) | SC-005 |
