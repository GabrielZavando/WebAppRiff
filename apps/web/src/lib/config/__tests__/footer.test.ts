import { describe, it, expect } from 'vitest';
import {
  SITE_FOOTER_CONTENT,
  FOOTER_COPYRIGHT,
  FOOTER_LOCATION,
} from '@/lib/config/footer';
import type { SocialNetworkName } from '@/lib/types/contact';

/**
 * Runtime tests for the site-footer content config.
 *
 * The type-level contract is asserted in
 * `lib/types/__tests__/footer.test.ts`; this suite validates the actual
 * runtime carrier (`SITE_FOOTER_CONTENT`) following the mockup
 * `docs/design/components/Footer.png`:
 * - exact tagline copy ("Innovación tecnológica en la gestión de fluidos
 *   desde 1979."),
 * - exactly 2 link columns titled SERVICIOS and EMPRESA with real internal
 *   routes (change `web-content-and-ui-polish`): SERVICIOS deep-links to the
 *   four `/servicios#<slug>` field-service anchors (slugs 1:1 with
 *   `SERVICIOS_FIELD_SECTION`) and EMPRESA carries 3 internal links
 *   ("Proyectos de Éxito" was removed — no destination page exists),
 * - 2 schedule rows with the mockup day ranges/hours,
 * - the 24/7 support note,
 * - the copyright and location texts rendered in the bottom bar.
 *
 * Social links come from the env-driven `getContactInfo()` (the same source
 * shared with the contact page); their exact URLs are environment-dependent so
 * this suite only asserts they are a well-formed `SocialLink[]` with names
 * from the closed `SocialNetworkName` union.
 */
describe('SITE_FOOTER_CONTENT', () => {
  it('exposes the mockup tagline verbatim', () => {
    expect(SITE_FOOTER_CONTENT.tagline).toBe(
      'Innovación tecnológica en la gestión de fluidos desde 1979.',
    );
  });

  it('exposes logoAlt "Riff" (brand fallback used by the <Image> alt)', () => {
    expect(SITE_FOOTER_CONTENT.logoAlt).toBe('Riff');
  });

  it('has exactly 2 link columns titled SERVICIOS and EMPRESA, in that order', () => {
    expect(SITE_FOOTER_CONTENT.columns).toHaveLength(2);
    expect(SITE_FOOTER_CONTENT.columns.map((c) => c.title)).toEqual([
      'SERVICIOS',
      'EMPRESA',
    ]);
  });

  it('SERVICIOS renders the 4 real services', () => {
    const labels = SITE_FOOTER_CONTENT.columns[0]?.links.map((l) => l.label);
    expect(labels).toEqual([
      'Medición en Edificios',
      'Medición Industrial',
      'Obras y Proyectos',
      'Tratamiento de Agua y Desalinización',
    ]);
  });

  it('EMPRESA renders the 3 real internal links (Proyectos de Éxito removed)', () => {
    const links = SITE_FOOTER_CONTENT.columns[1]?.links ?? [];
    expect(links.map((l) => l.label)).toEqual([
      'Nuestra Historia',
      'Representaciones',
      'Contacto Directo',
    ]);
    expect(links.map((l) => l.href)).toEqual([
      '/nosotros#historia',
      '/representaciones',
      '/contacto',
    ]);
    // "Proyectos de Éxito" has no destination page: it must not come back.
    expect(
      links.some((l) => l.label === 'Proyectos de Éxito'),
    ).toBe(false);
  });

  it('SERVICIOS deep-links to the four /servicios field-service anchors (slugs 1:1 with SERVICIOS_FIELD_SECTION)', () => {
    const links = SITE_FOOTER_CONTENT.columns[0]?.links ?? [];
    expect(links.map((l) => l.href)).toEqual([
      '/servicios#medicion-en-edificios',
      '/servicios#medicion-industrial',
      '/servicios#obras-y-proyectos',
      '/servicios#tratamiento-de-agua',
    ]);
  });

  it('every column link carries a real internal route (no placeholder href="#")', () => {
    for (const column of SITE_FOOTER_CONTENT.columns) {
      const expectedLength = column.title === 'EMPRESA' ? 3 : 4;
      expect(column.links).toHaveLength(expectedLength);
      for (const link of column.links) {
        expect(link.href).not.toBe('#');
        expect(link.href.startsWith('/')).toBe(true);
      }
    }
  });

  it('renders the split-shift schedule with multiple hour blocks per day range', () => {
    expect(SITE_FOOTER_CONTENT.schedule).toHaveLength(2);
    expect(SITE_FOOTER_CONTENT.schedule.map((s) => s.days)).toEqual([
      'Lunes a Jueves',
      'Viernes',
    ]);
    // Each entry's `hours` is an array of split-shift blocks.
    expect(SITE_FOOTER_CONTENT.schedule[0]?.hours).toEqual([
      '9:00 a 13:00 hrs.',
      '14:00 a 18:00 hrs.',
    ]);
    expect(SITE_FOOTER_CONTENT.schedule[1]?.hours).toEqual([
      '9:00 a 13:00 hrs.',
      '14:00 a 17:00 hrs.',
    ]);
  });

  it('exposes the schedule column title "Horario de Atención"', () => {
    expect(SITE_FOOTER_CONTENT.scheduleTitle).toBe('Horario de Atención');
  });

  it('exposes the 24/7 support note', () => {
    expect(SITE_FOOTER_CONTENT.scheduleNote).toBe('Soporte 24/7 disponible');
  });

  it('socialLinks is a well-formed SocialLink[] reusing ContactInfo', () => {
    const socialNames: SocialNetworkName[] = [
      'Facebook',
      'X',
      'Instagram',
      'LinkedIn',
    ];
    for (const link of SITE_FOOTER_CONTENT.socialLinks) {
      expect(socialNames).toContain(link.name);
      expect(typeof link.href).toBe('string');
    }
    // The set of rendered networks is a subset of the closed union (no typo
    // names leak in).
    for (const link of SITE_FOOTER_CONTENT.socialLinks) {
      expect(['Facebook', 'X', 'Instagram', 'LinkedIn']).toContain(link.name);
    }
  });
});

describe('FOOTER_COPYRIGHT / FOOTER_LOCATION', () => {
  it('exposes the mockup copyright text (muted uppercase bottom bar)', () => {
    expect(FOOTER_COPYRIGHT).toBe(
      '© 2024 RIFF SPA. TODOS LOS DERECHOS RESERVADOS.',
    );
  });

  it('exposes the mockup location text', () => {
    expect(FOOTER_LOCATION).toBe('SANTIAGO, CHILE');
  });
});