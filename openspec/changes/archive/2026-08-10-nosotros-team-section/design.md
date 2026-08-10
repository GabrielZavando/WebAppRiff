# Design — NosotrosTeamSection

## Context

The public Astro site (`apps/web`) follows a strict per-section architecture: **types** (`lib/types/*.ts`) → **hardcoded config content** (`lib/config/*.ts`) → **dumb presentational component** (`components/*.astro`) → **page assembly** (`pages/index.astro`). Existing sections (SolutionSection, ServicesSection, DestacadosSection, PilaresSection) all follow this 3-file pattern, consume Tailwind v4 design tokens from `@theme` in `globals.css`, use `astro:assets` `<Image>` for all site images and Lucide via `astro-icon` for icons.

The client delivered a new section design (`docs/design/components/NosotrosSection.png`): "Liderazgo & Experiencia" heading, subtitle, and 3 team member cards (photo + name + role). Photos are already in the repo (`apps/web/src/assets/img/f-1.jpg`, `f-2.jpg`, `f-3.jpg`). The client explicitly requested a hover interaction: the navy overlay must become more transparent (revealing the color photo) and the photo must zoom slightly using CSS 3D transforms (`scale3d` / `transform3d`) for better animation performance.

## Goals / Non-Goals

**Goals:**
- Deliver `NosotrosTeamSection` as a dumb component consistent with the existing section architecture.
- Render the section on the home page immediately after `PilaresSection`.
- Implement the hover effect (overlay fade 80% → 30% + `scale3d(1.05)` zoom) with smooth, GPU-friendly animation.
- Keep full TypeScript safety (readonly props, closed union for roles, no `any`).
- Respect flat design (no `rounded*`, no `shadow*`), responsive grid (1 → 2 → 3 cols), lazy images below the fold.
- Cover with unit tests (Vitest) following the repo's `__tests__/` convention.

**Non-Goals:**
- No page `/nosotros` — the section is a home-page block only in this change (nav link `/nosotros` already exists; a future change will build the page).
- No admin panel (Angular) work.
- No backend/API/data-model changes (content is SSG hardcoded).
- No real team member data fetching — mockup personas (Steven Marks, Lara Smith, John Doe) are the starting content; replacing them is a config-only edit.
- No carousel/slider or team member detail (modal, bio) — out of scope.

## Decisions

### D1 — Dumb presentational component (props-only)

`NosotrosTeamSection.astro` receives everything via `Props extends NosotrosTeamSectionProps` and only renders. No data fetching, no services, no business logic in frontmatter (only destructuring). Consistent with all existing sections.

- **Alternative considered**: a smart component that builds its own data — rejected: repo pattern is explicit, tested, and facilitates future CMS injection.

### D2 — Hardcoded content in `lib/config/nosotros-team-section.ts`

`NOSOTROS_TEAM_SECTION_CONTENT: Readonly<NosotrosTeamSectionProps>` with `TEAM_MEMBERS: readonly TeamMember[]` (3 members). Images imported as `ImageMetadata` via the `@` alias. Any copy/photo change is a config-only edit + rebuild (SSG).

### D3 — Heading hierarchy

- `<h2>` for the section title ("Liderazgo & Experiencia") — the home page's single `<h1>` is owned by HeroBanner; other sections use `<h2>`/`<h3>` accordingly.
- Eyebrow, subtitle: `<span>`/`<p>` (not headings), like PilaresSection.
- Member names are NOT headings (they are card labels under a section `<h2>`; avoids heading jumps). Roles render as `<p>`/`<span>` uppercase.

### D4 — Closed union `TeamMemberRole`

```ts
export type TeamMemberRole = 'gerente-general' | 'jefe-de-proyectos' | 'comercial';
```

A typo in config breaks at compile time instead of rendering wrong text. Consumed as `member.role`.

### D5 — Card structure and hover animation (key decision)

Each card is a `relative overflow-hidden group` container:

```
<div class="relative overflow-hidden group">
  <Image  … class="absolute inset-0 h-full w-full object-cover
                     grayscale group-hover:grayscale-0 scale3d(1,1,1)
                     group-hover:… transition-[filter,transform] duration-300 ease-out will-change-transform" />
  <div    … class="absolute inset-0 bg-linear-to-b from-secondary/30 to-secondary/85
                     group-hover:from-secondary/10 group-hover:to-secondary/55
                     transition-[background-image] duration-300 ease-out" />
  <div    … class="relative z-10 p-6 flex flex-col justify-end">
    <span class="font-heading font-bold text-white">{name}</span>
    <span class="font-heading font-semibold uppercase text-primary">{role}</span>
  </div>
</div>
```

**POST-APPLY FIX #1 (2026-08-09, client feedback on the rendered section):**
the original solid `bg-secondary/80` overlay + full-color photo was replaced by
a three-part interaction that reads more elegant:

- **Idle state**:
  - Overlay is a **linear vertical gradient** (`bg-linear-to-b` = from top to
    bottom): more transparent at the top (`from-secondary/30`) and less
    transparent at the bottom (`to-secondary/85`) so the name/role text stays
    legible while the photo remains partially visible.
  - Photo is rendered **grayscale** (`grayscale`, i.e. 100% desaturated) in
    black & white.
- **Hover state** (whole card, `group-hover`):
  - **The overlay does NOT disappear** — it only becomes more transparent at
    both stops (`from-secondary/10`, `to-secondary/55`); the gradient shape
    (transparent top / darker bottom) is preserved.
  - Photo **loses the grayscale filter** (`group-hover:grayscale-0`) showing
    the color photo, and scales via `scale3d(1.05, 1.05, 1)` (subtle zoom).
  - All three transitions run smoothly with ease-out timing (≈300–350ms;
    `duration-300` built-in is used, see risk note below). Nothing snaps:
    filter, transform and background-image all animate.
- **Why `grayscale` on the photo instead of a heavier overlay**: the client
  explicitly asked for a B&W image revealed in color on hover. Combining the
  desaturation filter with the gradient overlay produces the "tinta sobre la
  foto" look without ever fully hiding the photo. The `grayscale` filter
  animates with `transition-[filter,…]` (filter is a compositable CSS
  property, cheap to animate).
- **Why `bg-linear-to-b` + two opacity stops instead of a solid overlay**:
  client feedback ("degradado lineal menos transparente abajo y más
  transparente arriba") — text anchor is at the bottom of the card, so the
  darker bottom keeps the name/role readable; the lighter top frames the
  person's face. Tailwind v4 syntax is `bg-linear-to-b` (same family as the
  existing `bg-linear-to-r` used by Header/TopHeader).
- **Why the overlay never disappears**: client feedback ("no debe desaparecer,
  solo hacerse más transparente") — the gradient is the section's visual
  signature; hover only reveals more of the color photo underneath.
- **POST-APPLY FIX #2 (2026-08-09, client feedback): smooth fade via
  `opacity`, gradient values left hand-editable.** The first implementation
  animated the gradient STOPS (`transition-[background-image]` +
  `group-hover:from-secondary/10 group-hover:to-secondary/55`). CSS
  gradients are NOT reliably interpolated by all browsers (Safari and older
  engines snap the `background-image` instead of animating it) — the client
  reported the gradient "cambia abruptamente". The fix:
  1. The overlay keeps ONE static gradient declaration
     (`bg-linear-to-b from-secondary/50 to-secondary/90`) — these stop
     VALUES are intentionally left as Tailwind classes in the component
     because the client edits them BY HAND (`apps/web/src/components/
     NosotrosTeamSection.astro`, overlay `<div>` inside `members.map`).
  2. The hover animation NO LONGER touches the gradient: the whole overlay
     fades via `transition-opacity` from `opacity-100` (rest) to
     `group-hover:opacity-60`. Opacity is 100% compositable and interpolable
     in every browser → smooth, elegant, no abrupt change. The gradient
     SHAPE is preserved and simply becomes more transparent as a whole —
     exactly "solo hacerse más transparente".
- **POST-APPLY FIX #3 (2026-08-09, final hand-tuned overlay values).** The
  client hand-tested intermediate values (`/80 /95 opacity-90 →
  opacity-80`) and asked for the delivered recipe A: `from-secondary/50` at
  the top (the person's face stays visible), `to-secondary/90` at the
  bottom (name/role anchor stays legible), rest `opacity-100` fading to
  `group-hover:opacity-60` (perceptible hover reveal: effective ~30% top /
  ~54% bottom) while the overlay NEVER disappears.
- **POST-APPLY FIX #4 (2026-08-09, darker bottom third).** Client: "Necesito
  que en el tercio bajo de la imagen sea más oscuro". A two-stop linear
  gradient darkens uniformly from top to bottom and CANNOT localize
  darkness in the bottom third, so the overlay gains a third stop
  **positioned at 67%** of the card height (`via-secondary/75 via-[67%]`):
  `bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%]
  to-secondary/95`. Effect: the top two thirds stay light (face visible,
  OCR-like name/role anchor unaffected), while the bottom third ramps
  from 75% → 95% opacity — a clearly darker band at the base. Rest
  `opacity-100` / hover `group-hover:opacity-60` unchanged (the fade lever
  stays element opacity). The stop positions are kept as hand-editable
  Tailwind classes for the client (`via-[67%]` can be nudged toward 80% for
  a narrower darker band or toward 50% for a taller one).
- **POST-APPLY FIX #2: center card lowered on desktop.** The middle card
  (index 1, Lara Smith) carries `lg:translate-y-8` so on `lg` screens it
  sits slightly lower than its neighbors — a staggered composition the
  client requested ("la imagen del centro, en dispositivos de escritorio,
  debe estar ligeramente más abajo"). `translate-y` (not `mt-`) keeps the
  grid flow/layout untouched and only shifts the card visually; the offset
  applies at `lg` only (mobile/tablet keep all three cards aligned).
- **Why `scale3d` over `scale()`**: the user explicitly asked for 3D
  transforms; `scale3d(x, y, 1)` (and its underlying `transform3d`
  composition) promotes the element to its own GPU layer, avoiding
  main-thread repaints during the animation. Combined with
  `will-change: transform`, the browser can pre-composite the layer → smoother
  animation on low-end devices.
- **Tailwind v4 does not ship a `scale3d` utility for 3-axis values by
  default**, so the hover scale is implemented as an explicit CSS rule in the
  component's `<style>` block (scoped with a component-specific class, e.g.
  `.team-card-image`), keeping the `transform: scale3d(1.05, 1.05, 1)` exact.
- **Reduced motion** (a11y): `@media (prefers-reduced-motion: reduce)` in the
  component `<style>` sets `transform: none` and `transition: none` on the
  image (no zoom, no filter/transform animation — grayscale flips
  instantly); the overlay background-image transition is also disabled. The
  hover state itself still applies (color photo + lighter gradient), so
  interactivity feedback remains visible without animation.
- **Why `overflow-hidden`**: the scaled photo must not bleed outside the
  card. Cards have no radius (flat design), so `overflow-hidden` has no
  visual side effect.
- **Why `group`/`group-hover`**: single-element hover that affects children
  (image + overlay) without JS. Note: `group-hover` works on the whole card
  including the text area, which is the desired affordance (whole card is
  interactive visual feedback).

### D6 — Image pipeline and performance

- All 3 photos via `astro:assets` `<Image>` (sharp service) with `loading="lazy"` (below the fold), `alt` descriptive per photo, **rendered grayscale in idle and revealed in color on hover** (`grayscale` → `group-hover:grayscale-0`).
- `will-change: transform` only on the image; the overlay animates `opacity` (POST-APPLY FIX #2: `background-image` gradient-stop animation was removed because gradient interpolation is not reliable across browsers — opacity is universally smooth).

### D7 — Flat design and tokens

- `bg-bg` section background, centered header, `text-secondary` title, `text-text-2` subtitle, `font-heading`/`font-body` from `@theme`.
- No `rounded*` (radius 0), no `shadow*` in static state.

### D8 — Testing strategy

- `lib/types/…`: type-level tests (compile + structural checks of the contract).
- `lib/config/…`: content tests (headline, subtitle, exactly 3 members, roles belong to the closed union, images are `ImageMetadata`).
- Component test (`components/__tests__/nosotros-team-section.test.ts`): rendered output contains the `<h2>` title, subtitle, 3 cards with the right names/roles, image imports, and the hover-related structure (`group`, `overflow-hidden`, overlay class, transform class / reduced-motion rule present in styles) via the repo's testing helpers.

## Risks / Trade-offs

- **[Custom CSS class needed for `scale3d`]** → Mitigation: scoped `<style>` in the component with a component-prefixed class name; kept minimal (one rule for idle/hover + reduced-motion override).
- **[Gradient stop interpolation across browsers]** → **RESOLVED by POST-APPLY FIX #2**: the first implementation animated `background-image` stops, which snap in browsers that don't interpolate gradients (Safari/older engines) — the client reported the abrupt change. The overlay now animates `opacity` only (`opacity-100 → group-hover:opacity-40`), which is universally smooth. The gradient declaration itself stays static and hand-editable by the client.
- **[`group-hover` applies to whole card, not just photo]** → Mitigation: accepted trade-off; whole-card hover is the desired affordance and matches the client mockup intent (hover "sobre cualquiera de las imágenes" is satisfied since the image fills the card).
- **[Duration token `duration-350` may not exist]** → Mitigation: use Tailwind built-in `duration-300` + `ease-out` if no 350ms token is present in `globals.css` (`--transition-*` tokens aren't part of the declared token set); the animation remains smooth. Spec wording "≈350ms" is approximate.
- **[Grayscale filter on photos departs from ServicesSection (full color)]** → Mitigation: intentional — explicit client request for this section (B&W idle, color on hover, POST-APPLY FIX #1). The grayscale is a per-component class (`grayscale`), not a global token change.
- **[Mockup personas are placeholder content]** → Mitigation: content lives in config; client can swap names/roles/photos without touching the component.
- **[Lazy images may flash on scroll into view]** → Mitigation: acceptable for below-the-fold photos; overlay starts at 80% anyway, softening any decode flash.

## Migration Plan

- Add `NosotrosTeamSection` + config + types + tests; update `pages/index.astro` to render after `<PilaresSection />`.
- Rollback: remove the import and `<NosotrosTeamSection … />` line from `index.astro` (single-file revert).

## Open Questions

- None blocking. (Approximate duration confirmed as "subtle/smooth" by the user; if 350ms utility is unavailable, `duration-300` is the fallback per D5.)