/**
 * Types shared by the home page "Liderazgo & Experiencia" team section.
 *
 * The section is a presentational (dumb) component: it receives all its data
 * through props, so these interfaces are the contract between the page
 * (which owns the configuration via `NOSOTROS_TEAM_SECTION_CONTENT`) and
 * `NosotrosTeamSection.astro` (which only renders).
 *
 * See `openspec/changes/nosotros-team-section/design.md` for the rationale:
 * § Decision 1 (dumb component), § Decision 3 (heading hierarchy: section
 * `<h2>` owned by the header, member names are NOT headings) and § Decision
 * 4 (`TeamMemberRole` is a closed union, NOT a free `string`: a typo like
 * `'comercial '` breaks at compile time instead of rendering wrong role text
 * at runtime — same rationale as `PilarIconName`).
 */

import type { ImageMetadata } from 'astro';

/**
 * The closed set of roles a team member may hold.
 *
 * Each value matches the role labels shown in `docs/design/components/
 * NosotrosSection.png` (Gerente General, Jefe de Proyectos, Comercial),
 * kebab-cased. Consumed by `NosotrosTeamSection.astro` to render the
 * uppercase role text under the member name. Extending this union (e.g.
 * adding a "Sub Gerente" role) is a single-file change (design.md §
 * Decision 4).
 */
export type TeamMemberRole = 'gerente-general' | 'jefe-de-proyectos' | 'comercial';

/**
 * A single team member card rendered in the section grid.
 *
 * `name` is the member's display name, rendered white and bold over the
 * photo. `role` is restricted to `TeamMemberRole` and rendered uppercase in
 * the primary teal token. `image` is the member photo imported from
 * `@/assets/img/` (client-delivered `f-1.jpg` / `f-2.jpg` / `f-3.jpg`),
 * optimized via `astro:assets`. `imageAlt` is a descriptive alt text that
 * describes the photo (NOT the member name verbatim, per
 * frontend-standards § "Imágenes del sitio").
 */
export interface TeamMember {
  /** Member display name, e.g. "Steven Marks". Rendered in white bold. */
  readonly name: string;
  /** Member role, restricted to `TeamMemberRole`. Rendered uppercase teal. */
  readonly role: TeamMemberRole;
  /** Member photo, imported from `@/assets/img/`, optimized by astro:assets. */
  readonly image: ImageMetadata;
  /** Descriptive alt text for the member photo (not the name verbatim). */
  readonly imageAlt: string;
}

/**
 * Props accepted by `NosotrosTeamSection.astro`.
 *
 * `headline` is the section title ("Liderazgo & Experiencia") rendered as
 * `<h2>`; `subtitle` is the descriptive paragraph under it (design.md §
 * Decision 3). `eyebrow` is the uppercase label above the headline — part of
 * the contract for future use (the mockup does not display it; whether the
 * component renders it is decided in § Decision 3 / task 3.1). `members` are
 * the team member cards in render order (exactly 3 in the home config).
 * All fields are readonly so the config constant can be safely shared.
 */
export interface NosotrosTeamSectionProps {
  /** Section headline, e.g. "Liderazgo & Experiencia", rendered as `<h2>`. */
  readonly headline: string;
  /** Section subtitle paragraph under the headline. */
  readonly subtitle: string;
  /** Uppercase label above the headline (contract only — see design.md). */
  readonly eyebrow: string;
  /** Team member cards in render order; exactly 3 in the home config. */
  readonly members: readonly TeamMember[];
}