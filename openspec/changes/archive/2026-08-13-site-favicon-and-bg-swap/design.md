## Context

El sitio público Astro (`apps/web`) está construido sobre Astro 7.1.6 con Tailwind v4. Los cambios afectan a tres componentes/colaterales distintos pero interrelacionados por una decisión de marca:

1. **Identidad visual del sitio (favicon)**: el sitio viene con un placeholder SVG (`apps/web/public/favicon.svg` — cuadrado turquesa con una "R" blanca). El cliente entregó el logo real (`logo_riff.png`) y quiere que sea visible como favicon. Astro 7 auto-inyecta únicamente archivos con nombres estándar (`favicon.ico`, `favicon.svg`) desde `public/`. Como `logo_riff.png` no usa un nombre estándar, hay que declararlo explícitamente con una etiqueta `<link rel="icon">` en el `<head>` del layout. La spec actual `image-assets` prohíbe explícitamente añadir imágenes en `public/` (excepto `og-image.png`), por lo que esta excepción debe documentarse como caso de uso legítimo del favicon.

2. **Jerarquía visual del home**: el orden de secciones en `apps/web/src/pages/index.astro` es `HeroBanner → PanelHome → SolutionSection → ServicesSection → DestacadosSection → PilaresSection → NosotrosTeamSection`. SolutionSection usa `bg-bg` (claro), ServicesSection usa `bg-secondary-dark` (azul marino oscuro `#16202E`) y DestacadosSection usa `bg-primary-deep` (verde azulado profundo `#006874`). El cliente quiere invertir los colores de ServicesSection y DestacadosSection para que ServicesSection sea el bloque turquesa (más prominente, transmite "servicios") y DestacadosSection pase a ser el bloque azul marino (más sobrio, presenta productos). Ambos tokens ya existen en `apps/web/src/styles/globals.css`, por lo que el cambio es puramente de markup + tokens existentes. No hay nuevas definiciones CSS.

3. **Comentarios de los componentes**: ambos `.astro` tienen bloques de comentarios extensos (40-50 líneas) que documentan decisiones de diseño, incluyendo la descripción del color de fondo y la transición contra la sección adyacente. Los de ServicesSection dicen que crea una transición dura desde el `bg-bg` (claro) de SolutionSection arriba — esto sigue siendo válido después del swap. Los de DestacadosSection dicen que transiciona desde el `bg-bg` ServicesSection arriba — esto queda obsoleto después del swap (ServicesSection ahora es `bg-primary-deep` turquesa, no `bg-bg` claro). Ambos comentarios deben actualizarse para reflejar el nuevo estado y mantener coherencia con el principio "comentarios explican el porqué" (documentation-standards).

## Goals / Non-Goals

**Goals:**
- Hacer que el favicon del sitio muestre el logo real de Riff (`logo_riff.png`) en todos los navegadores modernos.
- Intercambiar las clases de fondo de `ServicesSection` y `DestacadosSection` para invertir la jerarquía visual del home.
- Mantener la coherencia entre el markup, los tests, las specs y los comentarios descriptivos (los 4 deben estar sincronizados tras el cambio).
- Regenerar los snapshots de Vitest afectados para reflejar el nuevo HTML.

**Non-Goals:**
- No se modifica la paleta de tokens (`globals.css` queda intacto; ambos tokens ya existen).
- No se modifica el orden de las secciones en el home.
- No se modifica ningún otro componente, layout, ni página.
- No se elimina `favicon.svg` (se mantiene por compatibilidad con navegadores/bots que aún lo consulten, sin efecto visual porque la `<link rel="icon">` explícita tiene prioridad).
- No se añade un nuevo color literal hex en ningún componente (frontend-standards § Design Tokens prohíbe literales; se usan los tokens ya existentes).
- No se cambian los atributos `alt`, `loading`, ni el pipeline `astro:assets` de ninguna imagen.
- No se modifica la API, modelo de datos, ni dependencias (`package.json` queda intacto).

## Decisions

### D1 — Favicon: etiqueta `<link rel="icon">` explícita, conservar `favicon.svg` placeholder

Se añade una línea en el `<head>` de `apps/web/src/layouts/Layout.astro`:

```html
<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32" />
```

Se coloca inmediatamente después de la etiqueta `<meta name="generator" />` existente (línea 57), siguiendo el orden típico de meta del `<head>`.

- *Por qué*: Astro 7 solo auto-inyecta `favicon.ico`/`favicon.svg` con nombres estándar. Como el cliente entregó el archivo con un nombre no estándar (`logo_riff.png`), la única forma de que los navegadores lo carguen es declararlo explícitamente. La etiqueta con `type="image/png"` y `sizes="32x32"` documenta la intención y permite a los navegadores elegir el mejor recurso si en el futuro se añaden variantes (`16x16`, `apple-touch-icon`, etc.).
- *Por qué conservar `favicon.svg`*: cero coste (3 líneas de un SVG trivial) y compatibilidad con cualquier crawler/bot/legacy browser que aún consulte `/favicon.svg` directamente. La etiqueta `<link rel="icon">` explícita tiene prioridad sobre el fallback automático de Astro, así que el navegador siempre elegirá `logo_riff.png` cuando ambos existan.
- *Alternativa rechazada*: renombrar `logo_riff.png` a `favicon.png` y dejar que Astro lo auto-inyecte. Descartada porque (a) el cliente entregó el archivo con un nombre específico que probablemente usa en otros contextos (intranet, email signatures, etc.); renombrarlo localmente podría generar confusión en futuras actualizaciones; (b) la etiqueta explícita es más autodocumentada (`<link rel="icon" type="image/png" href="/logo_riff.png">` deja claro de un vistazo cuál es el favicon activo).
- *Alternativa rechazada*: importar `logo_riff.png` desde `src/assets/img/` y procesarlo vía `astro:assets`. Descartada porque (a) los navegadores hacen la petición a `/favicon.ico`/`/favicon.png` directamente a la raíz del sitio, no al pipeline de assets; (b) el favicon no necesita las optimizaciones AVIF/WebP de `astro:assets` (el navegador lo usa como bitmap a 16/32px y rara vez reescala); (c) `src/assets/img/` ya tiene un guard explícito en la spec `image-assets` (frontend-standards § image-assets) reservado para imágenes del sitio procesables; mezclar favicons ahí difumina la convención.

### D2 — Excepción documentada en spec `image-assets` para el favicon PNG

La spec `image-assets` actualmente dice (Requirement: "The Open Graph image is the only public/ asset exception"): "No other image asset SHALL be added to `apps/web/public/` in this change." Se modifica para admitir una segunda excepción técnica: el favicon personalizado del sitio puede vivir en `apps/web/public/` con un nombre no estándar cuando lo requiera el flujo de entrega del cliente. Se actualiza el escenario "OG image exists as a public binary" para añadir el favicon como segunda excepción legítima.

- *Por qué*: la regla general (todo lo optimizable en `src/assets/img/` vía `astro:assets`) sigue siendo correcta para imágenes del sitio que se renderizan en componentes (hero, logo del header, fotos de productos, etc.). El favicon es un caso especial: lo consumen los navegadores directamente contra la raíz, no se beneficia del pipeline de `astro:assets`, y suele entregarse con un nombre de archivo estable por motivos de marca. Documentar la excepción explícitamente en la spec evita que un futuro lint o revisión bloquee el patrón y deja claro el criterio técnico detrás de la decisión.
- *Alternativa rechazada*: crear una spec nueva (`favicon-asset` o similar) solo para el favicon. Descartada por exceso: una capability entera para una etiqueta `<link>` + un binario es overkill y fragmenta la spec `image-assets` que ya cubre el patrón general.

### D3 — Swap de clases: 1 línea por componente, sin tocar markup interno

`ServicesSection.astro` línea 52: `class="py-16 md:py-24 bg-secondary-dark"` → `class="py-16 md:py-24 bg-primary-deep"`.
`DestacadosSection.astro` línea 48: `class="py-16 md:py-24 bg-primary-deep"` → `class="py-16 md:py-24 bg-secondary-dark"`.

Se actualiza también la línea descriptiva del bloque de comentarios en cada archivo (ServicesSection líneas 17-23; DestacadosSection líneas 16-21) para reflejar el nuevo token y, en el caso de DestacadosSection, corregir la frase obsoleta que decía que ServicesSection arriba era `bg-bg` claro (nunca lo fue; siempre fue `bg-secondary-dark` hasta ahora).

- *Por qué*: el cambio de una clase CSS no requiere alterar markup interno, props, ni comportamiento. El resto de cada componente (imágenes, cards, CTAs, tipografía, sombras) ya estaba validado contra el fondo oscuro genérico y se ve igualmente bien sobre cualquier color oscuro de la paleta (turquesa `#006874` o navy `#16202E`); los textos blancos mantienen contraste suficiente en ambos.
- *Por qué actualizar el comentario de DestacadosSection sobre la transición adyacente*: documentation-standards dice "los comentarios explican el porqué". Si ServicesSection ahora es turquesa (`bg-primary-deep`) y DestacadosSection pasa a ser navy (`bg-secondary-dark`), la transición visual del home es: SolutionSection (claro `bg-bg`) → ServicesSection (turquesa `bg-primary-deep`) → DestacadosSection (navy `bg-secondary-dark`). El comentario actual dice que DestacadosSection transiciona desde el `bg-bg` ServicesSection, lo cual ya era inexacto antes del swap (ServicesSection nunca fue `bg-bg` claro) y queda doblemente obsoleto después.
- *Alternativa rechazada*: mover el swap a un sistema de variantes (`bg-primary-deep` para "service" vs `bg-secondary-dark` para "product") parametrizado desde el index.astro. Descartada por exceso de abstracción para un cambio puramente cosmético en 2 archivos.

### D4 — Tests y snapshots: actualizar antes de codear (TDD roja), regenerar después (verde)

`ServicesSection.test.ts` líneas 31-36: cambiar el `it(...)` description y la aserción de `bg-secondary-dark` → `bg-primary-deep`. Mantener el resto del test intacto.
`DestacadosSection.test.ts` líneas 31-37: cambiar el `it(...)` description y las dos aserciones (`toContain('bg-primary-deep')` → `toContain('bg-secondary-dark')`, `not.toContain('bg-secondary-dark')` → `not.toContain('bg-primary-deep')`). Mantener el resto intacto.

Después del cambio de markup, regenerar snapshots con `vitest -u`:
- `apps/web/src/components/__tests__/__snapshots__/ServicesSection.test.ts.snap` línea 3: `<section class="py-16 md:py-24 bg-secondary-dark">` → `bg-primary-deep`
- `apps/web/src/components/__tests__/__snapshots__/DestacadosSection.test.ts.snap` línea 3: `<section class="py-16 md:py-24 bg-primary-deep">` → `bg-secondary-dark`

- *Por qué*: las aserciones actuales codifican el token de fondo como parte del contrato de cada componente. Si se cambia el markup sin actualizar el test, el test falla con un mensaje claro que guía la corrección (TDD roja). Si se cambia solo el markup y se regenera el snapshot sin actualizar el test, se pierde la garantía de que el componente usa el token correcto. Por eso el flujo correcto es: actualizar test (rojo) → cambiar markup (verde) → regenerar snapshot.
- *Por qué regenerar el snapshot explícitamente y no dejarlo a `vitest -u` automático*: el snapshot es un artefacto versionado; debe revisarse el diff (1 sola clase CSS cambia en cada archivo) para confirmar que no se introdujeron cambios espurios en el HTML por error.

## Risks / Trade-offs

- **[Risk] Los snapshots de Vitest fallarán tras el cambio de markup y bloquearán la suite.** → Mitigation: regenerar con `vitest -u` y revisar el diff (solo la clase de fondo del `<section>` debe cambiar; nada más). El comando `vitest -u` es seguro porque los snapshots están bajo control de código y el diff es trivialmente inspeccionable.
- **[Risk] El favicon puede no aparecer inmediatamente si los navegadores cachean el `favicon.ico`/`favicon.svg` antiguo.** → Mitigation: documentar en el commit que el usuario puede necesitar un hard-refresh (Ctrl+Shift+R) o limpiar la cache del navegador. En producción, la etiqueta `<link rel="icon">` explícita tiene prioridad sobre el fallback automático, así que el navegador la respetará en cuanto recargue la página.
- **[Risk] El cambio de color de ServicesSection podría alterar la percepción de "dónde está la sección de servicios" en el home.** → Mitigation: verificación visual en dev server (`npm run dev` en `apps/web`) tras el cambio, revisando móvil/tablet/desktop. Si el cliente prefiere revertir, el swap es simétrico e idempotente (intercambiar dos clases no tiene estado).
- **[Risk] Olvidar actualizar el bloque de comentarios descriptivo del componente dejaría un doc obsoleto que confundiría a futuros lectores.** → Mitigation: el tasks.md incluye una tarea explícita de actualización de comentarios por archivo. El diff es trivialmente revisable (1 línea por archivo).
- **[Risk] El favicon PNG podría no tener una versión adecuada para pantallas de alta densidad (retina).** → Mitigation: por ahora se sirve un solo tamaño (`sizes="32x32"`); el navegador lo reescala. Si el cliente observa pixelación en el futuro, se puede añadir un `apple-touch-icon.png` y/o un `sizes="any"` con un asset 2x sin tocar este cambio.

## Migration Plan

- Aditivo + simétrico: deploy es un rebuild normal de `apps/web` (SSG). No hay migraciones de base de datos, cambios de API, ni nuevos tokens CSS.
- Rollback: revertir los 3 archivos cambiados (`Layout.astro`, `ServicesSection.astro`, `DestacadosSection.astro`) + restaurar los 2 snapshots + eliminar `logo_riff.png` de `public/`. Idempotente.
- Cache de favicon: tras deploy, los navegadores pueden tardar hasta varios minutos en refrescar el favicon cacheado; se documenta en el commit message.

## Open Questions

- (none — el cliente fue explícito: `logo_riff.png` en `public/`, ServicesSection → `bg-primary-deep`, DestacadosSection → `bg-secondary-dark`. No hay ambigüedad residual.)
