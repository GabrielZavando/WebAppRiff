## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/header.ts` con `NavItem`, `CtaConfig`, `HeaderProps` (readonly, tipado estricto)
- [x] 1.2 Crear `apps/web/src/lib/config/navigation.ts` con `NAVIGATION_ITEMS` (5 items), `isActive()`, `getCtaConfig()`
- [x] 1.3 Test unitario `navigation.test.ts`: `isActive('/', '/')` → true
- [x] 1.4 Test unitario: `isActive('/', '/nosotros')` → false
- [x] 1.5 Test unitario: `isActive('/nosotros', '/nosotros/equipo')` → true
- [x] 1.6 Test unitario: `isActive('/nosotros', '/nosotr')` → false
- [x] 1.7 Test unitario: `getCtaConfig()` con env vars definidas y ausentes (fallback)

## 2. Tailwind & Assets

- [x] 2.1 Añadir `brand-orange: '#F97316'` a `apps/web/tailwind.config.mjs`
- [x] 2.2 Crear `apps/web/src/components/icons/MenuIcon.astro` (hamburger, blanco, 24x24)
- [x] 2.3 Crear `apps/web/src/components/icons/CloseIcon.astro` (X, blanco, 24x24)
- [x] 2.4 Extender `apps/web/.env.example` con `CTA_LABEL` y `CTA_HREF`

## 3. Componente Header.astro (TDD)

- [x] 3.1 Escribir `Header.test.ts` (AstroContainer): renderiza logo link con `aria-label="Ir al inicio"`
- [x] 3.2 Test: renderiza los 5 items en orden dentro de `<nav aria-label="Navegación principal">`
- [x] 3.3 Test: item activo con `aria-current="page"` y underline `brand-orange`
- [x] 3.4 Test: `Inicio` activo solo cuando `activePath === "/"`
- [x] 3.5 Test: CTA con label/href correctos y clases `bg-brand-orange uppercase font-bold`
- [x] 3.6 Test: nav desktop con `hidden lg:flex`; toggle con `lg:hidden`
- [x] 3.7 Test: a11y (un solo `<header>`, aria-labels, `aria-expanded`)
- [x] 3.8 Test: snapshot del HTML renderizado (regresión visual)
- [x] 3.9 Crear `apps/web/src/components/Header.astro` (estructura + gradiente + container + props tipadas)
- [x] 3.10 Implementar logo placeholder con TODOs `[user]` y `[site-header-scroll-animations]`
- [x] 3.11 Implementar nav desktop + estado activo
- [x] 3.12 Implementar CTA
- [x] 3.13 Implementar hamburguesa + panel mobile + `<script is:inline>` (toggle `aria-expanded`/`hidden`)

## 4. Refactor TopHeader

- [x] 4.1 Cambiar `<header>` → `<div role="region" aria-label="Barra de contacto">` en `TopHeader.astro`
- [x] 4.2 Verificar que `TopHeader.test.ts` existente sigue pasando sin cambios (regenerar snapshot del markup del wrapper)
- [x] 4.3 Actualizar `e2e/top-header.spec.ts`: localizar la barra por `role=region` con nombre "Barra de contacto" (ya no es `banner`/`header`)

## 5. Integración en Layout

- [x] 5.1 Actualizar `Layout.astro`: importar `Header` + helpers, computar `headerProps` con `Astro.url.pathname`, renderizar bajo `<TopHeader />`
- [x] 5.2 Crear `apps/web/src/pages/cotizacion.astro` (placeholder)
- [x] 5.3 E2E Playwright: index muestra Header con logo + 5 items + CTA en desktop (>= 1024px)
- [x] 5.4 E2E: en mobile (< 1024px) hamburger visible y nav desktop oculto
- [x] 5.5 E2E: click en hamburger expande panel mobile con los 5 items
- [x] 5.6 E2E: GET `/cotizacion` retorna 200 y contiene "Solicitar cotización"

## 6. Verificación & Cleanup

- [x] 6.1 `npm run build --workspace=apps/web` → success
- [x] 6.2 `npm run typecheck --workspace=apps/web` → success
- [x] 6.3 `npm run lint --workspace=apps/web` → success
- [x] 6.4 `npm run test --workspace=apps/web` → all pass
- [x] 6.5 `npm run test:smoke --workspace=apps/web` → E2E pass
- [x] 6.6 `openspec validate site-header` → valid
- [x] 6.7 `openspec status --change site-header --json` → todos los artefactos completos
