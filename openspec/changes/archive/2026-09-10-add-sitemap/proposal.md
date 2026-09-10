## Why

AUDIT M1 (2026-09): el sitio público Astro (`apps/web`) declara SEO como prioridad
(ver `stack.md`/`client.md`) pero el build no genera `/sitemap.xml`: `@astrojs/sitemap`
está ausente de `apps/web/package.json` y de `astro.config.mjs`. Sin sitemap, los motores
de búsqueda no descubren de forma fiable las 9 páginas estáticas ni los 71 productos
dinámicos SSG (`/productos/<slug>` vía `getStaticPaths`), dejando el catálogo dependiendo
solo del crawling por enlaces internos.

## What Changes

- **`apps/web/package.json`**: añade la dependencia `@astrojs/sitemap` (sin peer-dependency
  sobre Astro, compatible con `astro 7.1.6`). *Capa: infraestructura/deps.*
- **`apps/web/astro.config.mjs`**: añade la integración `sitemap()` al array
  `integrations`. No añade lógica de dominio; el sitemap se desprende de `site`
  (que ya usa `process.env.SITE_URL`) y de `getStaticPaths` de las páginas. *Capa:
  infraestructura/config.*
- **No se toca** `Layout.astro` (canonical ya resuelto en build-time) ni `nginx.conf`
  (el `try_files $uri $uri/ =404` ya sirve el XML estático con `application/xml` sin
  configuración extra).
- **Tests de configuración** (Vitest, patrón `env-example.test.ts`): un test que afirma
  que `sitemap()` está integrado en `astro.config.mjs` y en `package.json`, y un test que
  valida que el `site` de producción no sea `localhost` (contrato `SITE_URL`).

## Capabilities

### New Capabilities

- `add-sitemap`: generación automática de sitemap del sitio público Astro — `sitemap()`
  integrado en `astro.config.mjs`, `@astrojs/sitemap` en `apps/web/package.json`, y tests
  de configuración que validan la integración y el contrato de dominio canónico (`site`
  no-locallhost en producción).

### Modified Capabilities

<!-- No cambia ningún requisito funcional existente: canonical/OG/Twitter ya emitidos por
Layout.astro; el contrato `SITE_URL` y el build Dockerfile no se alteran. -->

## Impact

- **Código**: `apps/web/package.json` (1 dep añadida), `apps/web/astro.config.mjs`
  (1 integración), `apps/web/src/config/__tests__/*` (tests de configuración).
- **Artefacto de build**: `dist/` ahora incluye `sitemap-index.xml` + `sitemap-0.xml`.
- **Contracts/env**: sin cambios de contrato; `SITE_URL` ya era consumida por `astro.config.mjs`.
- **Deploy**: el runtime nginx sirve el XML sin cambios (`try_files`); el Dockerfile ya
  inyecta `SITE_URL=https://somosriff.cl` como build-arg.
- **Riesgo**: bajo — cambio aditivo y retrocompatible; único punto a verificar es la
  compatibilidad de `@astrojs/sitemap` con Astro 7.1.6 (confirmada: sin peer range).