## Why

En el breakpoint `sm` (≥ 640px, tablet pequeña o móvil en horizontal) la home presenta varios defectos de composición: el logo queda pegado al borde superior, el select del buscador se comprime y trunca su texto, los botones flotantes tapan el texto inferior del hero, el CTA secundario "Escríbenos" pierde contraste sobre la imagen clara, las grillas de servicios y equipo no adoptan su disposición de tablet y los divisores de estadísticas se ven irregulares. Corregir estos puntos ahora evita una experiencia degradada justo en el rango que hoy no cubren los ajustes mobile-first ni los de escritorio.

## What Changes

- **Header**: centrar verticalmente el logo y darle aire simétrico arriba/abajo desde `sm`, con un tamaño mayor que en móvil y sin romper el contrato 2× de escritorio.
- **Buscador**: desde `sm`, reservar al `<select>` un ancho fijo suficiente para su texto y que no se encoja; el `<input>` ocupa el resto (`flex-1`).
- **Hero**: el CTA secundario "Escríbenos" pasa a fondo blanco con texto navy para garantizar contraste sobre cualquier imagen; el contenido reserva espacio inferior/derecho para que los botones flotantes (WhatsApp y teléfono) no tapen texto a 640px.
- **Grillas de productos**: se mantiene/verifica `sm:grid-cols-2` en "Nuestros Productos" y "Soluciones Destacadas", y se eleva "Servicios especializados" de `md:grid-cols-2` a `sm:grid-cols-2`.
- **Grilla de equipo**: "Liderazgo & Experiencia" pasa a 3 columnas desde `sm` (hoy apila hasta `md`).
- **Estadísticas del panel**: se reemplaza el divisor por `gap-px` sobre fondo primario por un esquema determinista de `divide-x`/`divide-y` más un único borde exterior, eliminando líneas superpuestas o irregulares.
- **Cobertura**: se añade el viewport `640×360` / `640×800` a la matriz responsive y e2e específicos de las grillas y del hero a 640px.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `site-header`: tamaño y centrado vertical del logo en `sm`.
- `search-form`: reparto de ancho entre select e input desde `sm`.
- `hero-banner`: contraste del CTA secundario y holgura para los botones flotantes en `sm`.
- `panel-home`: divisores deterministas del grid 2×2 de estadísticas.
- `services-section`: dos columnas desde `sm` en lugar de `md`.
- `team-section`: tres columnas desde `sm` en lugar de `md`/`lg`.
- `responsive-layout`: incorpora los viewports de 640px a la matriz de no-desborde.

## Impact

- Componentes: `Header.astro`, `SearchForm.astro`, `HeroBanner.astro`, `PanelHome.astro`, `ServicesSection.astro`, `NosotrosTeamSection.astro`.
- Verificación sin cambio de requisito: `SolutionSection.astro` y `DestacadosSection.astro` ya declaran `sm:grid-cols-2`; se cubren con e2e a 640px.
- Tests: unit tests con `AstroContainer`, snapshots de `Header`, `SearchForm`, `HeroBanner`, `PanelHome`, `ServicesSection` y `NosotrosTeamSection`; e2e de grid y responsive.
- Sin cambios de API, backend, Firestore, variables de entorno ni infraestructura.
