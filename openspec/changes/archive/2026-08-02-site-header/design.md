## Context

El sitio público Astro (apps/web/) se encuentra en Fase A (bootstrap). Ya existe `TopHeader.astro` (utility bar con teléfono y redes sociales, archivado en `2026-08-02-top-header`) y un layout global `Layout.astro`. La imagen de referencia `docs/design/components/Header.png` muestra el header principal: logo a la izquierda, menú de 5 items (item activo con underline naranja) y botón CTA naranja "SOLICITAR COTIZACIÓN" a la derecha, sobre fondo degradado `brand-navy → brand-navy-light`.

Decisiones confirmadas con el cliente:
- El logo será grande y se achicará al hacer scroll, pero ese efecto se implementa en un change futuro (`site-header-scroll-animations`). Este change entrega el header estático con el logo en tamaño completo.
- El logo real lo añadirá el usuario luego; aquí se renderiza un placeholder con TODO explícito.
- El menú mobile usa hamburguesa con `<script is:inline>` (descartado `<details>`).
- Los items del menú son hardcoded (5 fijos).
- Nuevo token `brand-orange` para CTA y underline activo.
- El CTA apunta a `/cotizacion` (ruta placeholder nueva).

## Goals / Non-Goals

**Goals:**
- Componente `Header.astro` presentacional puro (dumb): recibe `items`, `activePath`, `cta`, `logoAlt` por props; sin fetching ni estado de dominio
- Lógica de matching de ruta (`isActive`) extraída a `lib/config/navigation.ts` para testearla aislada (SRP Astro: frontmatter sin lógica de negocio no trivial)
- Un único landmark `<header>` por página (refactor de TopHeader)
- Config tipada: `NAVIGATION_ITEMS` constante + `getCtaConfig()` con fallback a defaults
- Tests Vitest (unit + snapshot) y E2E Playwright cubriendo desktop/mobile/accesibilidad
- Colores vía tokens de `tailwind.config.mjs` (`brand-navy`, `brand-navy-light`, `brand-orange`)

**Non-Goals:**
- NO shrink-on-scroll del logo (change futuro `site-header-scroll-animations` — se deja TODO en el bloque del logo)
- NO fetch desde API backend (SSG: la navegación es estática)
- NO variaciones por página del menú (siempre los mismos 5 items)
- NO animaciones complejas del menú mobile (apertura simple con toggle)
- NO breadcrumbs, sub-navegación ni búsqueda en el header

## Decisions

1. **Dumb presentational component**: `Header.astro` no hace fetching ni lee `import.meta.env`. `Layout.astro` calcula `activePath` con `Astro.url.pathname` y pasa props. Cumple SRP de `frontend-standards.md` § "Principios de Diseño — Astro".

2. **Lógica de ruta activa en `lib/`**: `isActive(itemHref, currentPath)` en `lib/config/navigation.ts`. Reglas: `/` es activo solo si `currentPath === "/"`; otros hrefs son activos con match exacto o prefijo (`currentPath.startsWith(href + '/')`). Evita falsos positivos tipo `/nosotr` → `/nosotros`.

3. **Hamburguesa con `<script is:inline>`** (decisión del cliente, sobre `<details>`): script de ~15 líneas que togglea `aria-expanded` y el atributo `hidden` del panel `#mobile-nav`. Sin hydration, compatible con SSG, sin dependencias.

4. **Refactor de TopHeader**: `<header>` → `<div role="region" aria-label="Barra de contacto">`. La spec `top-header` no cambia a nivel de requisitos (ningún scenario menciona el elemento wrapper), así que NO es un "modified capability"; el requirement de accesibilidad de `site-header` lo cubre.

5. **Token `brand-orange: '#F97316'`** añadido a `tailwind.config.mjs`. Coherente con la arquitectura de tokens existente (`brand-navy`). Si el cliente entrega un hex corporativo distinto, se cambia en un solo lugar.

6. **Placeholder de logo**: `<div>` con `w-[165px] h-[80px]`, borde dashed, texto "Logo placeholder", envuelto en `<a href="/">`. Comentarios `TODO[user]` (reemplazar asset) y `TODO[site-header-scroll-animations]` (shrink-on-scroll) en el mismo bloque para que los cambios futuros sean de pocas líneas.

7. **Página `cotizacion.astro`**: placeholder mínimo con `<Layout>` para evitar 404 en el CTA. Se reemplaza en el change del formulario de cotización.

## Risks / Trade-offs

- **Risk**: `import.meta.env.CTA_*` ausentes en build → **Mitigation**: `getCtaConfig()` con defaults; tests cubren ambos casos.
- **Risk**: `isActive` con prefijos ambiguos (ej. `/servicios` vs `/servicios2`) → **Mitigation**: matcheo con `startsWith(href + '/')` + tests de límites.
- **Risk**: Dos landmarks `<header>` (regresión al tocar TopHeader) → **Mitigation**: scenario de accesibilidad en spec + test que cuenta `<header>` en el HTML renderizado.
- **Risk**: Menú mobile sin cierre al hacer click fuera → **Mitigation**: fuera de scope MVP; se documenta como mejora futura.
- **Trade-off**: Items hardcoded (no configurables) → Simplicidad y tipos estrictos; 5 items fijos no justifican config externa en SSG.

## Migration Plan

- No requiere migración de datos ni cambios de API.
- Deploy: build SSG estándar (misma pipeline que Fase A). Refactor de TopHeader y Header nuevo entran juntos en un solo cambio.
- Rollback: revertir el commit del change `site-header`.

## Open Questions

- Hex exacto del naranja corporativo (se usa `#F97316` como estimación de la imagen; el cliente puede confirmar antes de archivar).
- URLs finales de las páginas internas (los hrefs `/nosotros`, `/servicios`, etc. se fijan hoy como convención y se validan al crear cada página).
