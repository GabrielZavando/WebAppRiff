import type { NosotrosTeamSectionProps } from '@/lib/types/nosotros-team-section';
import type { TeamMember } from '@/lib/types/nosotros-team-section';
import type { TeamMemberRole } from '@/lib/types/nosotros-team-section';
import f1Img from '@/assets/img/f-1.jpg';
import f2Img from '@/assets/img/f-2.jpg';
import f3Img from '@/assets/img/f-3.jpg';

/**
 * Hardcoded content for the home page "Liderazgo & Experiencia" team section.
 *
 * Lives in `lib/config/` so the page (`apps/web/src/pages/index.astro`) can
 * spread it onto `<NosotrosTeamSection {...NOSOTROS_TEAM_SECTION_CONTENT} />`
 * without the component itself needing to know the marketing copy or the
 * image imports. Keeping it hardcoded is consistent with
 * `SOLUTION_SECTION_CONTENT`, `SERVICES_SECTION_CONTENT`,
 * `DESTACADOS_SECTION_CONTENT` and `PILARES_SECTION_CONTENT`: as the site is
 * SSG, any change requires a rebuild anyway. A future CMS/API migration will
 * replace this with content injected via props without touching the
 * component (design.md § Decisions 1/2).
 *
 * The member photos are the files delivered by the client in the design
 * package (`docs/design/components/NosotrosSection.png`):
 * `f-1.jpg` (380x502), `f-2.jpg` (380x499), `f-3.jpg` (380x502) from
 * `apps/web/src/assets/img/`. The `astro:assets` pipeline optimizes them and
 * the component renders them with `object-cover` under the linear gradient
 * overlay (`bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%]
 * to-secondary/95`), fading the whole overlay via opacity to
 * `group-hover:opacity-60` + `scale3d(1.05)` on hover (design.md §
 * Decisions 5/6/7, POST-APPLY FIX #1/#4).
 *
 * The subtitle intentionally uses "mundial" (lowercase L): the mockup
 * shipped a typo with a capital "L" ("clase mundiaL") which was corrected
 * during planning (see proposal.md).
 *
 * See `openspec/changes/nosotros-team-section/design.md` for the rationale:
 * Decision 1 (dumb component), Decision 2 (hardcoded constant),
 * Decision 4 (`TeamMemberRole` closed union + `getTeamMemberRoleLabel` pure
 * mapping to the display labels), Decision 6 (lazy images).
 */

/**
 * Maps a kebab-case `TeamMemberRole` (the closed union stored in config) to
 * the display label rendered over the photo, e.g. "Gerente General".
 *
 * Pure function next to the content so the component stays dumb and the
 * mapping is unit-testable without mounting the component
 * (frontend-standards § "Frontmatter sin lógica de negocio no trivial").
 * Extending the union requires extending this map (single-file change,
 * design.md § Decision 4).
 */
export function getTeamMemberRoleLabel(role: TeamMemberRole): string {
  switch (role) {
    case 'gerente-general':
      return 'Gerente General';
    case 'jefe-de-proyectos':
      return 'Jefe de Proyectos';
    case 'comercial':
      return 'Comercial';
  }
}

/**
 * The 3 team members in render order (client-specified, verbatim names from
 * the mockup `docs/design/components/NosotrosSection.png`). Each `role` is a
 * member of the closed union `TeamMemberRole` (design.md § Decision 4): a
 * typo here breaks the build instead of rendering wrong role text at
 * runtime.
 */
export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    name: 'Steven Marks',
    role: 'gerente-general',
    image: f1Img,
    imageAlt: 'Retrato de Steven Marks, Gerente General de Riff',
  },
  {
    name: 'Lara Smith',
    role: 'jefe-de-proyectos',
    image: f2Img,
    imageAlt: 'Retrato de Lara Smith, Jefe de Proyectos de Riff',
  },
  {
    name: 'John Doe',
    role: 'comercial',
    image: f3Img,
    imageAlt: 'Retrato de John Doe, ejecutivo comercial de Riff',
  },
];

/**
 * Full props bag for `NosotrosTeamSection.astro`: centered section header
 * copy (`headline` + `subtitle`) and the 3 member cards in render order.
 * Spread onto `<NosotrosTeamSection {...NOSOTROS_TEAM_SECTION_CONTENT} />`
 * by the page. `eyebrow` is part of the contract for forward compatibility
 * (design.md § Decision 3 — see also task 3.1 about whether the component
 * renders it; the mockup does not display it).
 */
export const NOSOTROS_TEAM_SECTION_CONTENT: Readonly<NosotrosTeamSectionProps> =
  {
    headline: 'Liderazgo & Experiencia',
    subtitle:
      'De una tradición familiar a la manufactura y servicios de clase mundial',
    eyebrow: 'Nuestro Equipo',
    members: TEAM_MEMBERS,
  };