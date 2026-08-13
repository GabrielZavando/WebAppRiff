## Context

El home del sitio público Astro usa un hero shell full-bleed (`Layout.astro` con `hero`). El orden vertical del shell es: TopHeader (oculto en móvil), Header (logo + nav, `h-24`), SearchForm (modo transparente en home), HeroBanner (contenido), PanelHome (panel superpuesto).

Los tres componentes (`Header`, `SearchForm`, `HeroBanner`) son presentacionales (dumb) y se testean con `vitest` + `experimental_AstroContainer`. Cada uno tiene un snapshot que captura el HTML renderizado.

Estado actual:
- Logo: `class="block h-auto w-[330px]"` — ancho fijo de 330px sin límite responsivo.
- SearchForm: `<div class="max-w-[860px] mx-auto py-4">` — sin padding horizontal (el spec actual lo prohíbe explícitamente en el escenario "Inner container uses max-w-860px without padding").
- HeroBanner: `<div class="relative container mx-auto py-16 md:py-24 lg:py-32">` — padding vertical simétrico grande.

## Goals / Non-Goals

**Goals:**
- Logo con ancho máximo responsivo (200px móvil / 300px desktop) que escala proporcionalmente.
- Buscador con respiración horizontal en móvil (`px-4`) sin afectar escritorio (`md:px-0`).
- Banner principal con contenido subido (padding superior reducido) para visibilidad en viewport inicial.

**Non-Goals:**
- No cambiar la lógica de negocio de ningún componente.
- No cambiar los atributos `width`/`height` del logo (relación de aspecto/CLS).
- No alterar la paleta de tokens de color ni introducir `rounded` (flat design se respeta).
- No modificar el modo transparente del SearchForm ni la integración en el Layout.

## Decisions

### D1 — Logo: `w-full max-w-[200px] sm:max-w-[300px]` (escala proporcional)
Se eligió `w-full` + `max-w-*` sobre un ancho fijo `w-[200px] sm:w-[300px]` para que el logo ocupe el ancho disponible hasta el tope, manteniendo la relación de aspecto dada por `width`/`height` (330×134). El wrapper `<a>` conserva `h-24 overflow-visible`, por lo que el logo puede seguir desbordando visualmente sin crecer el header. Alternativa considerada: ancho fijo `w-[...]` — descartada porque no aprovecha el espacio disponible en pantallas pequeñas de forma fluida.

### D2 — SearchForm: `px-4 md:px-0` en el contenedor interno
Se agrega padding horizontal solo en móvil (`px-4` = 16px, decisión del cliente) que se elimina en `md:` (`md:px-0`) para no reducir el ancho útil de 860px en escritorio. Esto REEMPLAZA la prohibición absoluta de padding horizontal del spec actual (escenario "does NOT contain px-4/px-6/px-8"), que se relaja a "no contiene px-6 ni px-8" (solo px-4 en móvil permitido). Motivo: el cliente pidió que el buscador no ocupe todo el ancho disponible en móvil.

### D3 — HeroBanner: padding vertical asimétrico `pt-4 pb-16 md:pt-8 md:pb-24 lg:pt-12 lg:pb-32`
Se separa el padding superior del inferior. El superior se reduce drásticamente (`pt-4`=16px móvil, `md:pt-8`=32px, `lg:pt-12`=48px) respecto al actual (`py-16`=64px). El inferior se conserva (`pb-16`/`md:pb-24`/`lg:pb-32`) para preservar el espaciado antes del PanelHome superpuesto. Motivo: el cliente quiere que título, subtítulo y CTAs queden visibles en el viewport inicial. La verificación visual en desktop/tablet queda pendiente de revisión del cliente.

### D4 — Header móvil más bajo: `h-20 lg:h-24` + `max-h-full lg:max-h-none` en el logo
Tras revisión en dispositivo, el header se percibía alto en móvil (~108px visibles) porque el contenedor usaba `h-24` (96px) fijo en todos los breakpoints y el logo (con `w-full`) podía desbordar visualmente por `overflow-visible`, empujando la percepción del buscador hacia abajo. No existía margin/padding inferior real; el alto venía de `h-24`. La corrección: (a) reducir el alto del header en móvil/tablet a `h-20` (80px) manteniendo `lg:h-24` (96px) en desktop; (b) agregar `max-h-full` al `<img>` del logo (y `lg:max-h-none` en desktop) para que en pantallas pequeñas el logo NUNCA supere el alto del header y, por tanto, no pueda hacerlo crecer. En desktop se restaura el overflow 2× original. Esto garantiza un header compacto en móvil sin sacrificar el ancho máximo del logo (200px móvil / 300px desktop cuando cabe).

### D5 — SearchForm inner width reduced to 800px (client review, post-apply)
The client requested the search box be slightly narrower so it does not dominate the hero on mid-size screens. The inner container max-width is reduced from `max-w-[860px]` to `max-w-[800px]`. All other constraints (centering, `px-4 md:px-0`, no `container` utility, no `px-6`/`px-8`) are unchanged. This is a delta over the archived `search-form` spec requirement; the scenario "Inner container uses max-w-860px and mobile horizontal padding" is rewritten to assert `max-w-[800px]`.

### D6 — HeroBanner `<h1>` enlarged across all breakpoints (client review, post-apply)
The client requested a larger hero headline. The `<h1>` base size moves from `text-4xl` to `text-5xl` (mobile) and the desktop scale from `md:text-6xl` to `md:text-7xl`. The `font-heading font-bold text-white` classes and the highlighted `<span class="text-primary">` are unchanged. Subtitle (`text-xl md:text-2xl`) and description (`text-base`) are intentionally left as-is to preserve vertical rhythm. Final size is subject to the client's visual review.

### D7 — PanelHome overlap reduced to ~25% (`-mt-4 md:-mt-6 lg:-mt-8`) (client review, post-apply)
The client reviewed the home and found the panel overlapping the banner too much. The archived `panel-home` requirement targeted ~50% overlap with `-mt-16 md:-mt-24 lg:-mt-32`; the implemented value had drifted to `-mt-8 md:-mt-12 lg:-mt-16`. They requested ~25% overlap. Halving the current implemented desktop margin (`lg:-mt-16` ≈ 64px → `lg:-mt-8` ≈ 32px) yields the requested ratio. The responsive scale follows the same halving: mobile `-mt-8` → `-mt-4`, `md:-mt-12` → `md:-mt-6`. `relative` + `z-10` are preserved. This is a delta over the archived `panel-home` spec requirement; the scenario is rewritten to assert `-mt-4 md:-mt-6 lg:-mt-8`.

### D8 — SearchForm inner width reduced to 760px (further client review)
The client asked to narrow the search box further, from 800px to 760px. All other constraints (centering, `px-4 md:px-0`, no `container` utility, no `px-6`/`px-8`) are unchanged. This is a delta over the 800px requirement (D5).

### D9 — PanelHome overlap reduced to ~10% (`-mt-2 md:-mt-2 lg:-mt-3`) (client review, post-apply)
The client asked to reduce the overlap from ~25% to ~10%. Using the same proportionality as D7 (where 25% ≈ `lg:-mt-8` = 32px), 10% ≈ 32 × (10/25) = 12.8px → nearest Tailwind step `lg:-mt-3` (12px). Scaling the same ratio to the other breakpoints: mobile 25% was `-mt-4` (16px) → 10% ≈ 6.4px → `-mt-2` (8px); `md` 25% was `-mt-6` (24px) → 10% ≈ 9.6px → `-mt-2` (8px). Result: `-mt-2 md:-mt-2 lg:-mt-3`. `relative` + `z-10` preserved. Subject to the client's visual review.

### D10 — PanelHome minimal desktop overlap (`-mt-2 md:-mt-2 lg:-mt-1`) (client review, post-apply)
The client reviewed and found the desktop overlap still too large; they want the panel "even lower, barely overlapping the banner on desktop." We reduce the desktop negative margin from `lg:-mt-3` (12px, ~10%) to `lg:-mt-1` (4px, minimal/barely-visible overlap). Mobile/tablet stay at `-mt-2` (8px). `relative` + `z-10` preserved.

### D11 — PanelHome reduced desktop inner padding (`lg:p-12` on left half) (client review, post-apply)
The client also wants less padding on desktop. The left half previously used `lg:p-16` (64px); reduced to `lg:p-12` (48px) to match the right half and read tighter on large screens. Mobile/tablet (`p-8 md:p-12`) unchanged. The right half keeps `p-8 md:p-12` (already 48px at desktop).

### D12 — PanelHome 24px desktop overlap (`-mt-2 md:-mt-2 lg:-mt-6`) (client review, post-apply)
The client clarified that the HeroBanner occupies 100% of the viewport height and they need the PanelHome to sit 24px over the banner on desktop. The desktop negative margin moves from `lg:-mt-1` (4px, "barely") to `lg:-mt-6` (24px exact overlap, since Tailwind `mt-6` = 1.5rem = 24px). Mobile/tablet stay at `-mt-2` (8px). `relative` + `z-10` preserved. Note: this is a larger desktop overlap than the previous minimal step, per the client's explicit 24px measurement (the "baja aún más" wording referred to seating the panel onto the full-height banner, not reducing the overlap).

### D13 — PanelHome 16px desktop overlap (`-mt-2 md:-mt-2 lg:-mt-4`) (client review, post-apply)
The client confirmed the 24px interpretation but wants the panel even lower, with a 16px overlap on desktop. The desktop negative margin moves from `lg:-mt-6` (24px) to `lg:-mt-4` (16px, since Tailwind `mt-4` = 1rem = 16px). Mobile/tablet stay at `-mt-2` (8px). `relative` + `z-10` preserved.

### D14 — PanelHome 16px GAP below banner on desktop (`-mt-2 md:-mt-2 lg:mt-4`) (client review, post-apply)
The client confirmed via DevTools that the browser already renders `-16px` (≈18px with zoom), so the 16px overlap was applied — but they still perceived it as "muy solapado" because a negative margin pulls the panel UP over the banner, the opposite of "bajar". To seat the panel LOWER (below the banner, not overlapping) the desktop margin becomes positive: `lg:-mt-4` → `lg:mt-4` (16px gap). Mobile/tablet keep `-mt-2` (8px overlap) per earlier review. `relative` + `z-10` preserved. If the client wants zero gap or a different size, adjust the `lg:mt-*` value.

### D15 — PanelHome 8px GAP below banner on desktop (`-mt-2 md:-mt-2 lg:mt-2`) (client review, post-apply)
The client finalized the desktop separation at 8px: `lg:mt-4` (16px gap) → `lg:mt-2` (8px gap). Mobile/tablet keep `-mt-2` (8px overlap) per earlier review. `relative` + `z-10` preserved.

### D16 — PanelHome desktop direction finalized as 8px GAP (`-mt-2 md:-mt-2 lg:mt-2`) (client review, post-apply)
The client briefly tried `lg:-mt-2` (8px overlap) but, after confirming via DevTools that a negative margin pulls the panel UP (the opposite of "bajar"), settled on the positive gap: the FINAL desktop value is `lg:mt-2` (8px gap below the banner, no overlap). Mobile/tablet keep `-mt-2` (8px overlap). `relative` + `z-10` preserved. This supersedes the `lg:-mt-2` step in the earlier draft.

### D17 — HeroBanner content lowered on desktop via `lg:pt-24` (client review, post-apply)
The client requested the hero content (title/subtitle/CTAs) sit lower within the full-height banner. The desktop top padding moves from `lg:pt-12` (48px) to `lg:pt-24` (96px), pushing the content block downward. Mobile/tablet top padding (`pt-4`/`md:pt-8`) and bottom padding (`pb-16`/`md:pb-24`/`lg:pb-32`) are unchanged. The component comment (lines 37–40 of `HeroBanner.astro`) is updated to reflect the lowered content.

## Risks / Trade-offs

- [Risk] El logo más pequeño (200px) en móvil podría reducir la legibilidad de la marca. → Mitigation: 200px sigue siendo legible para el asset `logo-web.webp` (600×243 nativo); el `width`/`height` se conserva para CLS.
- [Risk] El padding asimétrico del banner podría acercar demasiado el contenido al header en algunos breakpoints. → Mitigation: se conserva `pt-4` mínimo en móvil; revisión visual pendiente en desktop/tablet según el cliente.
- [Risk] Los snapshots existentes fallarán tras el cambio. → Mitigation: regenerar con `vitest -u` y revisar diff visualmente.
