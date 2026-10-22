import type { ImageMetadata } from 'astro';

/**
 * A member of the Riff team, shared by the home page "Liderazgo &
 * Experiencia" section and the `/nosotros` team grid.
 *
 * `role` is the exact visible cargo string (not a slug): the roster has
 * eight unique roles and no translation layer is needed. `isFeatured` marks
 * the members surfaced on the home page. All fields are readonly so the
 * canonical roster can be safely shared between both pages.
 */
export interface TeamMember {
  /** Stable kebab-case identifier, e.g. "ruby-barrientos". */
  readonly id: string;
  /** Member display name, e.g. "Ruby Barrientos". */
  readonly name: string;
  /** Exact visible role, e.g. "Directora · Gerenta Comercial". */
  readonly role: string;
  /** Verbatim client-provided biography. */
  readonly description: string;
  /** Portrait imported from `@/assets/img/nosotros/`, optimized by astro:assets. */
  readonly image: ImageMetadata;
  /** Descriptive alt text for the portrait (not the member name verbatim). */
  readonly imageAlt: string;
  /** Whether the member is highlighted on the home page. */
  readonly isFeatured: boolean;
}
