import type { TeamMember } from '@/lib/types/team';

/**
 * Props accepted by `NosotrosTeamSection.astro`, the home page team section.
 *
 * Members use the shared `TeamMember` contract from `team-roster`; the home
 * config always supplies `FEATURED_TEAM_MEMBERS`.
 */
export interface NosotrosTeamSectionProps {
  /** Section headline, e.g. "Liderazgo & Experiencia", rendered as `<h2>`. */
  readonly headline: string;
  /** Section subtitle paragraph under the headline. */
  readonly subtitle: string;
  /** Uppercase label above the headline (contract only — not rendered). */
  readonly eyebrow: string;
  /** Team member cards in render order; exactly 3 in the home config. */
  readonly members: readonly TeamMember[];
}
