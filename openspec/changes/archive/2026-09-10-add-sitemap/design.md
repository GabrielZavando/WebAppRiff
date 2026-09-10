## Context

AUDIT M1 (2026-09): pese a que SEO es prioridad declarada del sitio público, el build
Astro no genera sitemap. Estado actual verificado:

- `apps/web/package.json` no declara `@astrojs/sitemap`.
- `astro.config.mjs` solo integra `astroIcon()`; no hay integración de sitemap.
- `Layout.astro` ya emite `rel=canonical` + OG/Twitter en build-time usando `Astro.site` →
  la base canónica ya está resuelta; solo falta la generación del sitemap.
- `astro.config.mjs` define `site: process.env.SITE_URL || 'http://localhost:4321'`.
- `SITE_URL` ya está en `.env.example` y como build-arg del `apps/web/Dockerfile`.
- `nginx.conf` sirve estáticos con `try_files $uri $uri/ =404` → servirá `sitemap-index.xml`
  como `application/xml` sin configuración adicional.
- Páginas del sitio (9): index, productos (index + `[slug]` SSG con 71 productos vía
  `getStaticPaths`), servicios, marcas, cotizacion, contacto.

**Compatibilidad `@astrojs/sitemap` con Astro 7.1.6**: la versión `3.7.4` (latest) declara
`dependencies: { zod, sitemap }` y **sin `peerDependencies`** → compatible con `astro 7.1.6`.
El engine de instalación no choca contra un peer range.

## Goals / Non-Goals

**Goals:**

- `dist/` del build Astro contenga `/sitemap-index.xml` + las secciones `/sitemap-0.xml`.
- Los slugs de los 71 productos (SSG vía `getStaticPaths`) figuren en el sitemap.
- Todas las `<loc>` usen URLs absolutas al dominio canónico (`SITE_URL`), nunca localhost
  en producción.
- El xml se sirva públicamente 200 desde el runtime nginx sin cambios de `nginx.conf`.
- Canonical del `Layout.astro` coherente con el `<loc>` del sitemap.
- Tests de configuración automatizados (patrón `env-example.test.ts`).

**Non-Goals:**

- No se toca `Layout.astro` (canonical ya resuelto).
- No se modifica la lógica de dominio, endpoints ni el data model.
- No se implementa i18n/multi-idioma (out of scope; sitemap single-locale).
- No se añade configuración extra a `nginx.conf` (no es necesaria).
- No se gestionan los DNS de `somosriff.cl` (pendiente en otro flujo); aquí solo se
  garantiza que el sitemap use el dominio inyectado como `SITE_URL`.

## Decisions

### 1. Integración oficial `@astrojs/sitemap` (v3.7.4)

Se añade `@astrojs/sitemap@^3.7.4` a `apps/web/package.json` y `sitemap()` al array
`integrations` de `astro.config.mjs`. Es el plugin oficial y nativo de Astro, captura
automáticamente las rutas SSG (incluidas las dinámicas de `getStaticPaths`) y genera el
sitemap-index multi-sección cuando el número de URLs lo requiere. Sin lógica de dominio.

```js
import sitemap from '@astrojs/sitemap';
// integrations: [astroIcon(), sitemap()]
```

### 2. Contrato de dominio canónico vía `SITE_URL`

El `site` ya se deriva de `process.env.SITE_URL` con fallback localhost solo para
dev/staging. El build de producción inyecta `SITE_URL=https://somosriff.cl` (build-arg
del Dockerfile), por lo que todas las `<loc>` salen al dominio final. Se valida con un
test que el build de producción no puede producir un `site` localhost (contrato de env).

### 3. Tests de configuración estáticos (Vitest, lectura de archivo)

Siguiendo el patrón de `src/config/__tests__/{astro-config,env-example,package}.test.ts`,
los tests leen el archivo fuente (no lo importan, porque `astro.config.mjs` importa
`astro/config`, no resoluble en el isolate de vitest):

- Astro config: el archivo importa `@astrojs/sitemap` y llama `sitemap()` en `integrations`.
- Package json: `@astrojs/sitemap` declarado en `dependencies`.
- Env prod: si `NODE_ENV=production` (o `SITE_URL` explícito de prod), el sitio no puede
  quedar `http://localhost:4321` — validación del contrato canónico.

## Risks / Trade-offs

- **[`@astrojs/sitemap` incompatible con Astro 7.1.6]** → confirmado compatible (sin
  `peerDependencies`); si un futuro `specboot update` pinea Astro a otra major, revisar la
  versión de sitemap. Mitigado aquí con el pin `^3.7.4`.
- **[Build dev/staging sin `SITE_URL` genera localhost]** → intencional por el fallback;
  el Dockerfile prod siempre inyecta el dominio real, así que no se despliega.
- **[Sitemap enorme / 71 productos abruma un único `sitemap.xml`]** → `@astrojs/sitemap`
  genera automáticamente sitemap-index + secciones (`sitemap-0.xml`) según el límite de
  URLs por archivo; comportamiento esperado y cubierto en SC-201.

## Migration Plan

1. Crear el change `add-sitemap` (artifacts reguladores spec-driven).
2. `RED`: añadir tests de configuración y verificar que fallan (falta la integración).
3. `GREEN`: añadir `@astrojs/sitemap` a `package.json` e instalar; añadir `sitemap()` a
   `integrations` en `astro.config.mjs`.
4. Verificar: `vitest` del módulo, `astro build` con `SITE_URL` real → `sitemap-index.xml`
   + `sitemap-0.xml` en `dist/`, slugs de productos presentes, `<loc>` absolutas.
5. Validación de cierre: `openspec validate add-sitemap`, `bash check-refs.sh` y
   `bash specboot.sh --ci` con 0 errores; `/verify` + `/adversarial-review`.

**Rollback** (change aditivo): revertir los commits que tocan `package.json` y
`astro.config.mjs` deja el build sin sitemap, sin efecto colateral.

## Open Questions

- ¿El conteo de `<loc>` objetivo (9 estáticas + 71 productos = 80) se cumple en el build
  real? — se valida en el paso 4 con `rg -c '<loc>'` sobre `sitemap-0.xml`.