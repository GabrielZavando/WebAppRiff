import type { NosotrosTeamSectionProps } from '@/lib/types/nosotros-team-section';
import { FEATURED_TEAM_MEMBERS } from '@/lib/config/team';

/**
 * Content for the home page "Liderazgo & Experiencia" team section. The
 * members are the shared roster selection marked with `isFeatured`.
 */
export const NOSOTROS_TEAM_SECTION_CONTENT: Readonly<NosotrosTeamSectionProps> =
  {
    headline: 'Liderazgo & Experiencia',
    subtitle:
      'De una tradición familiar a la manufactura y servicios de clase mundial',
    eyebrow: 'Nuestro Equipo',
    members: FEATURED_TEAM_MEMBERS,
  };
