## Context

El sitio público `apps/web` (Astro 7.1.6, `output: 'static'` SSG) se construye sin assets de imagen reales:

- `HeroBanner.astro` (líneas 36-43) renderiza un fondo de gradiente CSS con un TODO explícito pidiendo la imagen industrial real.
- `Header.astro` (líneas 16-21) muestra un recuadro "Logo placeholder" con un TODO apuntando a `/logos/riff.svg`.
- `Layout.astro:19` genera el meta `og:image` a partir de `/og-image.png`, archivo que aún no existe en `public/`.

`astro:assets` (built-in desde Astro 4, habilitado por defecto en Astro 7) proporciona `<Image>` y `<Picture>` que optimizan imágenes importadas desde `src/` en build, con servicio `sharp` como peer opcional. El proyecto usa `astro-icon` + `@iconify-json` para iconos (no se tocan en este change). Los tests de componentes usan `AstroContainer` (Vitest) y los e2e usan Playwright.

## Goals / Non-Goals

**Goals:**
- Sustituir los 3 placeholders (hero, logo, OG) por los assets reales del cliente.
- Montar el pipeline `astro:assets` (con `sharp`) para servir el hero y el logo optimizados (AVIF/WebP + responsive `srcset`).
- Definir la convención `image-assets`: dónde viven los binarios, cómo se consumen, qué es excepción 1:1.
- Mantener el contraste del texto blanco del hero con un overlay oscuro sobre la imagen.
- Actualizar tests unitarios y smoke e2e para el nuevo contrato visual.

**Non-Goals:**
- Iconos (`astro-icon`): fuera de scope; la revisión del catálogo es un change separado.
- Fotos de productos del catálogo: viven en Firebase Storage vía backend (`docs/data-model.md` campo `galeria`).
- Imágenes remotas (Remote Image Service de `astro:assets`): se evalúa en un change futuro si el catálogo lo requiere.
- Migrar `apps/admin` a `astro:assets` (no aplica: es Angular con `NgOptimizedImage`).
- Crear una librería de componentes de imagen compartida; se usa el componente nativo de Astro directamente.

## Decisions

### D1. Usar `astro:assets` built-in (no `@astrojs/image`)
`astro:assets` está integrado en Astro 7.1.6 y expone `<Image>`/`<Picture>` desde `astro/components` con servicio `sharp` incluido. `@astrojs/image` está **deprecado** y descontinuado.
- **Alternativa considerada**: `@astrojs/image` — rechazada por deprecación.
- **Alternativa considerada**: servir los binarios desde `public/` sin optimizar — rechazada: no da AVIF/WebP ni `srcset` responsive, requisitos de `docs/frontend-standards.md`.

### D2. Instalar `sharp` como dependencia explícita
`sharp` es peer opcional de Astro que activa el servicio de imagen local en build SSG. Sin él, `astro build` falla (o degrada a `noop`) al encontrar imágenes locales procesadas.
- **Alternativa considerada**: depender del hoisting del monorepo — rechazada: frágil, `apps/web` debe declarar su propia dependencia.

### D3. Binarios en `apps/web/src/assets/img/` (carpeta plana)
Todas las imágenes **procesables** (hero, logo raster) viven en `src/assets/img/`, se importan con el alias `@` (`@/assets/img/hero.jpg`) y se consumen vía `<Picture>`/`<Image>`. Astro no impone estructura: se elige una carpeta plana `img/` por decisión del cliente.
- **Alternativa considerada**: subcarpetas `img/hero/`, `img/logos/` — el cliente prefirió plano.

### D4. Excepción 1:1: `public/og-image.png` para Open Graph
Las redes sociales (Facebook, WhatsApp, Twitter, LinkedIn, Telegram, Slack, Discord) exigen una **URL pública absoluta y estable** para `og:image`, formato **PNG** (no AVIF/WebP) y tamaño estándar 1200×630. El hash de build de `astro:assets` (`og-image.abc123.png`) rompería los shares cacheados. Por eso este único binario se sirve 1:1 desde `public/`, y `Layout.astro:19` (que ya referencia `/og-image.png`) queda **sin cambios de código**.
- **Alternativa considerada**: `og-image.png` en `src/assets/` con `getImage()` para generar la URL en build — rechazada: URL inestable entre builds, rompe caché social.

### D5. Hero con `<Picture>` + `loading="eager"` + overlay oscuro
El hero es above-the-fold, por lo que se carga con `loading="eager"` (no lazy). `<Picture>` genera `srcset` responsive con variantes AVIF/WebP y `sizes="100vw"`. Se pasan **`formats={['avif', 'webp']}` y `fallbackFormat="jpg"` explícitos** porque el componente `Picture` de Astro 7 usa por defecto solo `['webp']` con fallback `png` (pesado para fotos); para una foto industrial el fallback `jpg` comprime mejor. Sobre la imagen se mantiene un overlay oscuro (p. ej. `bg-secondary/60`) para preservar el contraste WCAG del texto blanco (`h1`/`h2`/`p` actuales).
- **Alternativa considerada**: `loading="lazy"` — rechazada: above-the-fold, empeora LCP/Core Web Vitals.
- **Alternativa considerada**: `<Image>` simple (una sola variante) — `<Picture>` da mejor cobertura de formatos modernos.

### D6. Logo con `<Image>` y `alt` accesible
El logo es raster (`logo-web.webp`, entregado por el cliente en **600×243**, ratio ~2.47:1). Se consume con `<Image>` de `astro:assets`: `alt={logoAlt}` (prop ya existente en `HeaderProps`, `'Riff'`), `width={165}` y `height={67}` — el ancho del placeholder original (165px) conservando el **aspect ratio nativo** del logo real (165 × 243/600 ≈ 67), en lugar de los 80px del placeholder que distorsionarían el asset. Las dimensiones explícitas evitan CLS. El link de logo mantiene `aria-label="Ir al inicio"`.
- **Nota de desviación**: `design.md` inicial declaraba 165×80 (dimensiones del placeholder); el logo real 600×243 obliga a ajustar el alto a 67 para no estirar el asset. Se actualizó también el delta spec `site-header` (escenario "Logo image is the real raster asset").
- **Alternativa considerada**: `<img>` estático con `src="/logos/riff.svg"` — rechazada: el cliente entregó logo raster, no SVG; `<Image>` lo optimiza y el estándar pide formatos modernos.

### D7. Convención `image-assets` como capability canónica
La capability `image-assets` documenta: rutas físicas, consumo obligatorio vía `astro:assets`, restricción "nada en `public/` salvo la excepción OG documentada", y que los iconos NO son assets de imagen (van por `astro-icon`).

## Risks / Trade-offs

- [Nombre de archivo del binario desconocido hasta que el cliente pegue el asset] → Mitigación: `tasks.md` incluye una tarea inicial de confirmación de binarios (`ls src/assets/img/`); los `import` en los `.astro` usan el nombre exacto confirmado. Si el cliente cambia de formato (p. ej. `logo.webp` en vez de `logo.png`), el cambio de import es puntual.
- [Hero optimizado con `widths` que no cubren la resolución real del asset → imágenes escaladas] → Mitigación: incluir en `widths` valores hasta el ancho real del binario (p. ej. `[400, 800, 1200, 1920]`); validar dimensión real del archivo entregado en `/apply`.
- [Sin `sharp`, `astro build` falla o degrada] → Mitigación: D2 (dependencia explícita) + smoke build en CI (`apps/web/package.json` ya tiene `build` script).
- [Contraste texto blanco sobre imagen industrial real] → Mitigación: D5 overlay oscuro; verificación visual en e2e Playwright y contraste WCAG.
- [Snapshots visuales cambian (Header, HeroBanner)] → Mitigación: regenerar snapshots como parte del change; los tests de estructura existentes se actualizan en la misma tarea TDD.
- [`og-image.png` con dimensiones incorrectas degrada la preview social] → Mitigación: validar 1200×630 en `/apply`; documentar el requisito en `image-assets`.

## Migration Plan

1. El cliente pega los binarios: `apps/web/src/assets/img/hero.<ext>`, `apps/web/src/assets/img/logo.<ext>`, `apps/web/public/og-image.png` (1200×630).
2. `/apply` implementa por tareas TDD: dependencia `sharp` → tests actualizados (red) → implementación en `.astro` (green) → smoke e2e.
3. `docs/frontend-standards.md` se ajusta para aclarar que "Astro Image" = `astro:assets` built-in.
4. **Rollback**: revertir el commit del change devuelve los placeholders CSS y el `div` de logo; el binario `public/og-image.png` se puede retirar sin impacto (los meta tags lo ignoran si no existe; si se revierte el binario junto al change, se vuelve al estado actual).

## Open Questions

- Nombres exactos y formatos de los binarios del cliente (se confirman antes de la tarea de implementación; el plan usa `hero.jpg` y `logo.png` como convención base).
- `alt` final de la imagen del hero (texto descriptivo del contenido de la foto industrial; provisionalmente "Instalación industrial de medición de fluidos Riff" — se confirma con el cliente en `/apply`).
