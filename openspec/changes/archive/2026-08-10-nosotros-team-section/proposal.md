# Proposal — NosotrosTeamSection

## Why

The home page currently ends after the "Pilares de Excelencia" section (`PilaresSection`). The client provided a new design (`docs/design/components/NosotrosSection.png`) showing a "Liderazgo & Experiencia" team section that builds trust and humanizes the company. The navigation already links to `/nosotros`, so the team block is the first concrete piece of that story. The section also demonstrates the flat-design + interactive hover language (overlay fade + subtle `scale3d` zoom) that sets the interaction standard for future sections.

## What Changes

- New dumb presentational Astro component `NosotrosTeamSection` for the public site (`apps/web`).
- New typed props contract in `apps/web/src/lib/types/nosotros-team-section.ts` (`TeamMember`, `TeamMemberRole` closed union, `NosotrosTeamSectionProps`).
- New hardcoded content constant `NOSOTROS_TEAM_SECTION_CONTENT` in `apps/web/src/lib/config/nosotros-team-section.ts` using existing images `f-1.jpg`, `f-2.jpg`, `f-3.jpg` from `assets/img/`.
- Renders a centered section header (`<h2>` "Liderazgo & Experiencia" + subtitle) followed by a responsive grid (1 → 2 → 3 columns) of team member cards.
- Each card: full-bleed photo (`astro:assets` `<Image>`, lazy), navy overlay (`bg-secondary/80`), member name (white, Montserrat bold) and role (primary/teal, uppercase) at the bottom.
- Hover interaction per card: overlay fades to `bg-secondary/30` while the photo scales via `scale3d(1.05, 1.05, 1)` with 350ms ease-out transitions; `will-change: transform` on the image and `overflow-hidden` on the card; `prefers-reduced-motion` disables the transform only.
- Home page (`pages/index.astro`): renders `<NosotrosTeamSection {...NOSOTROS_TEAM_SECTION_CONTENT} />` immediately after `<PilaresSection ... />`.
- Unit tests (Vitest) for types, config content and component rendering (title, subtitle, 3 cards, names/roles, hover-related CSS classes).

## Capabilities

### New Capabilities
- `team-section`: Presentational "Liderazgo & Experiencia" team section for the public home page — typed props, hardcoded config content, responsive card grid with hover overlay-fade + `scale3d` zoom, reduced-motion support.

### Modified Capabilities
<!-- None: no existing spec requirements change. -->

## Impact

- **Code**: `apps/web/src/components/NosotrosTeamSection.astro` (new), `apps/web/src/lib/types/nosotros-team-section.ts` (new), `apps/web/src/lib/config/nosotros-team-section.ts` (new), `apps/web/src/components/__tests__/nosotros-team-section.test.ts` (new), `apps/web/src/pages/index.astro` (modified — add import + render after `PilaresSection`).
- **Assets**: uses existing `apps/web/src/assets/img/f-1.jpg`, `f-2.jpg`, `f-3.jpg` (no new assets).
- **API**: none — content is hardcoded SSG config (no backend, no `docs/api-spec.yml` changes).
- **Data model**: none — no Firestore entities involved.
- **Dependencies**: none new (uses `astro:assets` `<Image>`, `astro-icon` not needed here, Tailwind v4 tokens).
- **Design tokens**: `bg-bg`, `text-secondary`, `text-text-2`, `text-white`, `text-primary`, `bg-secondary`, `font-heading`, `font-body`; strict flat design (no `rounded*`, no `shadow*`).