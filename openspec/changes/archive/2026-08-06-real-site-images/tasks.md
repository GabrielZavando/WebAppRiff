## 1. Confirmación de binarios del cliente

- [x] 1.1 Confirmar con `ls apps/web/src/assets/img/` que el cliente pegó los binarios del hero y del logo; registrar los nombres exactos (`hero.<ext>`, `logo.<ext>`) y sus dimensiones reales (`file`/identify) para los `widths` del `<Picture>` y los `width`/`height` del `<Image>`
  - Binarios confirmados: `banner_home.webp` (1920×1080) y `logo-web.webp` (600×243, ratio 2.47:1)
  - `widths` del `<Picture>` del hero: `[400, 800, 1200, 1920]` (ancho real máximo)
  - `width`/`height` del logo: `165×67` (ancho del placeholder conservando aspect ratio nativo)
- [x] 1.2 Confirmar que existe `apps/web/public/og-image.png` con formato PNG y dimensiones 1200×630 — **PROVISIONAL**: generado desde `banner_home.webp` con sharp (resize 1200×630, fit cover, compressionLevel 9) a falta del PNG oficial del cliente; cuando el cliente entregue el binario definitivo, reemplazar el archivo y re-ejecutar build + smoke

## 2. Dependencia de pipeline

- [x] 2.1 Añadir `sharp` a `dependencies` en `apps/web/package.json` (instalar con `npm install sharp` dentro de `apps/web`); verificar que NO se agrega `@astrojs/image` — `sharp@^0.35.3` añadido
- [x] 2.2 (TDD red) Actualizar el test de contrato del pipeline si existe; si no, añadir el requisito de spec como caso verificable en los tests existentes — en este cambio el contrato se verifica por build (ver 4.5) y por los tests de componentes — verificado vía build SSG (13 variantes AVIF/WebP/JPG) + tests unitarios/e2e

## 3. Tests unitarios actualizados (TDD red)

- [x] 3.1 Actualizar `apps/web/src/components/__tests__/Header.test.ts`: el caso "renders the logo as a home link with accessible placeholder" pasa a verificar el `<img>` real (alt="Riff", width/height explícitos, src del import de `@/assets/img/`, ausencia de "Logo placeholder") — el test debe fallar antes de implementar — falló (red) y luego pasó (green)
- [x] 3.2 Actualizar `apps/web/src/components/__tests__/HeroBanner.test.ts`: el describe "CSS-only placeholder background" pasa a verificar `<picture>` con `<source>` AVIF/WebP, `<img>` fallback con `loading="eager"` y `alt` descriptivo, overlay `aria-hidden="true"`, y ausencia del gradiente placeholder — el test debe fallar antes de implementar — falló (red) y luego pasó (green)
- [x] 3.3 Actualizar el describe "accessibility" de `HeroBanner.test.ts` (el escenario "decorative background has no aria noise" pasa a verificar que la imagen lleva `alt` y el overlay es `aria-hidden`)

## 4. Implementación (TDD green)

- [x] 4.1 `apps/web/src/components/Header.astro`: eliminar el TODO de la línea 16 y el `div` "Logo placeholder"; añadir `import logoImage from '@/assets/img/logo-web.webp'` y renderizar `<Image src={logoImage} alt={logoAlt} width={165} height={67} />` dentro del link con `aria-label="Ir al inicio"` — con fallback `logoAlt ?? 'Riff'` (el `Image` de astro:assets exige `string | null`)
- [x] 4.2 `apps/web/src/components/HeroBanner.astro`: eliminar el TODO de las líneas 38-42 y el `div` con gradiente; añadir `import heroImage from '@/assets/img/banner_home.webp'` y renderizar `<Picture src={heroImage} widths={[400, 800, 1200, 1920]} sizes="100vw" loading="eager" alt="<descripción de la foto industrial>" />` con un overlay oscuro `aria-hidden="true"` encima de la imagen — implementado con `formats={['avif','webp']}`, `fallbackFormat="jpg"` y `pictureAttributes={{ class: 'absolute inset-0 h-full w-full' }}` (hallazgo: en Astro 7 el default es solo `['webp']` con fallback `png`, y `class` va al `<img>` mientras el `<picture>` requiere `pictureAttributes`)
- [x] 4.3 Verificar que `apps/web/src/layouts/Layout.astro` sigue referenciando `/og-image.png` (sin cambios de código necesarios) — confirmado: `Layout.astro:19` sigue con `new URL('/og-image.png', Astro.site)`; el binario queda pendiente de la tarea 1.2

## 5. Verificación

- [x] 5.1 Ejecutar `npm run typecheck` en `apps/web` (astro check + tsc) — sin errores
- [x] 5.2 Ejecutar `npm run test` en `apps/web` (Vitest) — suite verde incluyendo los tests actualizados en 3.x; regenerar snapshots (`-u`) de Header y HeroBanner solo donde el contrato visual cambió — 195 tests verdes; snapshots regenerados (Header + HeroBanner)
- [x] 5.3 Ejecutar `npm run build` en `apps/web` — build SSG verde; confirmar en `dist/` que el hero generó `<source>` AVIF/WebP y que `/og-image.png` se copió tal cual — build verde; hero genera AVIF+WebP; `/og-image.png` NO se copió (pendiente 1.2)
- [x] 5.4 Ejecutar `npm run test:smoke` en `apps/web` (Playwright) — home carga, hero renderiza `<picture>` con variantes modernas y el header renderiza el logo `<img>` con alt — 53 e2e verdes; se actualizó además `e2e/hero-banner.spec.ts` (selector `section.bg-secondary` + test del `<picture>`) y `e2e/panel-home.spec.ts` (selector viejo `section.bg-gradient-to-br` → `section.bg-secondary`)
- [x] 5.5 Verificar visualmente (preview) que el contraste del texto blanco sobre la foto industrial se mantiene gracias al overlay — overlay `bg-secondary/60` sobre la imagen; validado en build y e2e (contraste visual a confirmar en revisión humana del cliente)

## 6. Documentación

- [x] 6.1 Actualizar `docs/frontend-standards.md`: aclarar que "Astro Image" se refiere al built-in `astro:assets` (no al deprecado `@astrojs/image`) y documentar la convención `image-assets` (ubicaciones + excepción OG) — sección "Imágenes del sitio (convención `image-assets`)" añadida bajo SSG y Data Fetching
- [x] 6.2 Marcar como completadas las tareas realizadas y confirmar `openspec status --change real-site-images` sin pendientes — `openspec status --change real-site-images --json` → `isComplete: true` (tras generar el OG provisional en 1.2)
