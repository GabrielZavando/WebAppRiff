## Why

El sitio público Astro (`apps/web`) aún usa **assets placeholder** en tres puntos: el `HeroBanner` se renderiza con un fondo de gradiente CSS puro (TODO explícito en `HeroBanner.astro:38`), el `Header` muestra un recuadro "Logo placeholder" (TODO en `Header.astro:16`) y el layout referencia `/og-image.png` en los meta tags Open Graph/Twitter (`Layout.astro:19`) **sin que ese archivo exista todavía** en `public/`. El cliente ya entregó las imágenes reales que quiere usar, por lo que es momento de sustituir los placeholders por los assets reales y montar el pipeline de optimización de imágenes de Astro para servirlas con formatos modernos (AVIF/WebP) y responsive `srcset`.

## What Changes

- **NEW capability `image-assets`**: define la convención canónica de assets de imagen del sitio público — ubicaciones físicas (`apps/web/src/assets/img/` para imágenes optimizables, `apps/web/public/og-image.png` como única excepción 1:1), consumo exclusivo vía `astro:assets` (`<Image>` / `<Picture>` con `import` desde `@/assets/img/...`), y la dependencia de pipeline `sharp`.
- **Dependencia**: añadir `sharp` a `dependencies` de `apps/web/package.json` (peer opcional que activa el servicio de imagen de `astro:assets` en build SSG). **NO** se instala `@astrojs/image` (deprecado; `astro:assets` es built-in desde Astro 4 y ya está habilitado por defecto en Astro 7).
- **HeroBanner** (`apps/web/src/components/HeroBanner.astro`): eliminar el TODO y el fondo CSS placeholder; renderizar la imagen industrial real con `<Picture>` de `astro:assets` (responsive `srcset` + formatos AVIF/WebP, `loading="eager"` por ser above-the-fold) manteniendo un overlay oscuro para preservar el contraste del texto blanco.
- **Header** (`apps/web/src/components/Header.astro`): eliminar el TODO y el recuadro "Logo placeholder"; renderizar el logo raster real con `<Image>` de `astro:assets` (optimizado, `alt` accesible desde la prop `logoAlt`, `width`/`height` explícitos).
- **Open Graph / Twitter cards**: añadir el binario real `apps/web/public/og-image.png` (PNG 1200×630, servido 1:1). Es la **única excepción** a la regla "nada en `public/`": las redes sociales exigen una URL pública absoluta y estable (`/og-image.png`) y PNG (no AVIF/WebP); el hash de build de `astro:assets` rompería los shares cacheados. `Layout.astro` no requiere cambios de código (ya referencia `/og-image.png`).
- **Tests**: actualizar `Header.test.ts` (el caso que verifica "Logo placeholder" pasa a verificar el `<img>` real con `alt` y dimensiones) y `HeroBanner.test.ts` (el describe "CSS-only placeholder background" pasa a verificar la presencia de `<picture>` con `<source>` AVIF/WebP y el `alt` de la imagen). Regenerar snapshots. Los escenarios correspondientes de `site-header` y `hero-banner` se actualizan como delta specs.
- **Iconos: fuera de scope** — los iconos se consumen vía `astro-icon` (`<Icon name="material-symbols:..." />`, `<Icon name="logos:..." />`); la revisión pendiente del catálogo de iconos es un change separado.

## Capabilities

### New Capabilities
- `image-assets`: Convención de assets de imagen del sitio público — rutas físicas (`src/assets/img/` para procesadas, `public/og-image.png` como excepción 1:1 para social cards), consumo obligatorio vía `astro:assets` (`import` + `<Image>`/`<Picture>`), dependencia `sharp`, y restricción de no añadir otros binarios en `public/`.

### Modified Capabilities
- `hero-banner`: el requisito "CSS-only placeholder background, no external image" cambia — el HeroBanner pasa a renderizar la imagen industrial real con `<Picture>` de `astro:assets` (AVIF/WebP responsive, `loading="eager"`) + overlay oscuro; se elimina el requisito de "zero external asset dependency" y el escenario "Decorative background has no aria noise" se ajusta a una imagen con `alt` descriptivo.
- `site-header`: el requisito "Header renders logo link" cambia — el logo deja de ser un recuadro placeholder y pasa a ser la imagen raster real con `<Image>` de `astro:assets`, `alt` desde la prop `logoAlt`, `width`/`height` explícitos.

## Impact

- `apps/web/package.json` — añadir `sharp` a `dependencies`.
- `apps/web/src/assets/img/` — **NEW** carpeta donde el cliente pega los binarios (`hero.<ext>`, `logo.<ext>`; nombres exactos se confirman en `/apply`).
- `apps/web/public/og-image.png` — **NEW** binario real (PNG 1200×630); única excepción a `public/`, justificada por el protocolo Open Graph.
- `apps/web/src/components/HeroBanner.astro` — reemplazar fondo CSS placeholder por `<Picture>` de `astro:assets`.
- `apps/web/src/components/Header.astro` — reemplazar recuadro "Logo placeholder" por `<Image>` de `astro:assets`.
- `apps/web/src/layouts/Layout.astro` — **sin cambios de código** (ya referencia `/og-image.png`); se valida la existencia del binario.
- `apps/web/src/components/__tests__/Header.test.ts` — actualizar caso del logo placeholder → logo real.
- `apps/web/src/components/__tests__/HeroBanner.test.ts` — actualizar describe del fondo CSS-only → imagen real.
- `apps/web/src/components/__tests__/__snapshots__/*.snap` — **REGEN** de snapshots de Header y HeroBanner.
- `apps/web/e2e/hero-banner.spec.ts`, `apps/web/e2e/site-header.spec.ts` — verificar en build que el hero renderiza `<picture>` con `<source>` y que el header renderiza el `<img>` del logo (extensión de smoke Playwright existente).
- `docs/frontend-standards.md` — confirmar que la sección "Imágenes optimizadas con formatos modernos (WebP, AVIF) — Astro Image" se refiere al built-in `astro:assets` (no al deprecado `@astrojs/image`).
- **Sin cambios**: `docs/api-spec.yml`, `docs/data-model.md`, `apps/backend/*` (las fotos de productos del catálogo viven en Firebase Storage, fuera de este change).
