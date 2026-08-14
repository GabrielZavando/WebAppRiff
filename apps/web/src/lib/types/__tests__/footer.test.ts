import { describe, it, expectTypeOf, expect } from 'vitest';
import type {
  FooterLink,
  FooterColumn,
  FooterScheduleEntry,
  SiteFooterProps,
} from '@/lib/types/footer';
import type { SocialLink } from '@/lib/types/top-header';
import { SITE_FOOTER_CONTENT } from '@/lib/config/footer';

/**
 * Type-level tests for the footer type contract.
 *
 * These interfaces are purely declarative (no runtime code is emitted by
 * `import type`), so the actual contract verification happens at TypeScript
 * compile time via `npm run typecheck` (tsc) — if the module path or any of
 * the referenced interfaces do not exist, typecheck fails.
 *
 * Vitest still executes these tests at runtime so we get a smoke check that:
 *   1. the import path resolves (esbuild fails if the file is missing when
 *      `expectTypeOf` materialises the type-level assertion),
 *   2. a runtime value of the expected shape can be constructed (proving the
 *      field names exist and accept the right kinds of values).
 *
 * The deeper behavioural assertions (exact tagline copy, exactly 2 columns
 * SERVICIOS/EMPRESA with 4 links each carrying `href="#"`, 2 schedule
 * entries, copyright/location texts) live in
 * `lib/config/__tests__/footer.test.ts` against `SITE_FOOTER_CONTENT`, the
 * runtime carrier of the contract.
 *
 * See `design.md` § Decision 4 (social icons reuse the `SocialLink` contract
 * from `top-header`: the footer must NOT define a parallel social type — one
 * single source of truth for the social presence) and § Decision 2 (column
 * titles are `<p>` labels, NOT headings — the footer must not alter the
 * per-page heading outline; hence `FooterColumn.title` is a plain string).
 */
describe('footer.ts types', () => {
  it('FooterLink exposes readonly label and href', () => {
    const link: FooterLink = { label: 'Nuestra Historia', href: '#' };

    expect(link.label).toBe('Nuestra Historia');
    expect(link.href).toBe('#');

    expectTypeOf<FooterLink>().toEqualTypeOf<{
      readonly label: string;
      readonly href: string;
    }>();
  });

  it('FooterColumn exposes readonly title and a readonly array of links', () => {
    const column: FooterColumn = {
      title: 'SERVICIOS',
      links: [{ label: 'Instalación de Medidores', href: '#' }],
    };

    expect(column.title).toBe('SERVICIOS');
    expect(column.links).toHaveLength(1);
    expect(column.links[0]?.label).toBe('Instalación de Medidores');

    expectTypeOf<FooterColumn>().toEqualTypeOf<{
      readonly title: string;
      readonly links: readonly FooterLink[];
    }>();
  });

  it('FooterScheduleEntry exposes readonly days and an array of hours blocks', () => {
    // `hours` is `readonly string[]` so a single day range can list one or
    // more split-shift hour blocks (design.md § Decision 3).
    const entry: FooterScheduleEntry = {
      days: 'Lunes a Jueves',
      hours: ['9:00 a 13:00 hrs.', '14:00 a 18:00 hrs.'],
    };

    expect(entry.days).toBe('Lunes a Jueves');
    expect(entry.hours).toHaveLength(2);
    expect(entry.hours[0]).toBe('9:00 a 13:00 hrs.');

    expectTypeOf<FooterScheduleEntry>().toEqualTypeOf<{
      readonly days: string;
      readonly hours: readonly string[];
    }>();
  });

  it('FooterScheduleEntry.hours accepts a string[] literal but NOT a single string', () => {
    // A string[] literal is assignable to the (readonly) hours array.
    expectTypeOf<string[]>().toMatchTypeOf<FooterScheduleEntry['hours']>();

    // A single string is NOT assignable — the contract requires an array of
    // hour blocks, removing the previous single-block shape (regression guard
    // for the widening in design.md § Decision 3).
    expectTypeOf<string>().not.toMatchTypeOf<FooterScheduleEntry['hours']>();
  });

  it('SiteFooterProps exposes the full readonly contract', () => {
    const props: SiteFooterProps = {
      logoAlt: 'Riff',
      tagline: 'Innovación tecnológica en la gestión de fluidos desde 1979.',
      socialLinks: [{ name: 'Facebook', href: 'https://facebook.com/riff' }],
      columns: [
        {
          title: 'SERVICIOS',
          links: [{ label: 'Instalación de Medidores', href: '#' }],
        },
      ],
      scheduleTitle: 'Horario de Atención',
      schedule: [
        { days: 'Lunes a Jueves', hours: ['9:00 a 13:00 hrs.', '14:00 a 18:00 hrs.'] },
      ],
      scheduleNote: 'Soporte 24/7 disponible',
    };

    expect(props.logoAlt).toBe('Riff');
    expect(props.tagline).toContain('1979');
    expect(props.socialLinks).toHaveLength(1);
    expect(props.columns).toHaveLength(1);
    expect(props.scheduleTitle).toBe('Horario de Atención');
    expect(props.schedule).toHaveLength(1);
    expect(props.scheduleNote).toContain('24/7');

    expectTypeOf<SiteFooterProps>().toEqualTypeOf<{
      readonly logoAlt: string;
      readonly tagline: string;
      readonly socialLinks: readonly SocialLink[];
      readonly columns: readonly FooterColumn[];
      readonly scheduleTitle: string;
      readonly schedule: readonly FooterScheduleEntry[];
      readonly scheduleNote: string;
    }>();
  });

  it('SiteFooterProps.scheduleTitle is a readonly string (config-sourced column title)', () => {
    // `scheduleTitle` was previously hardcoded inside the component as
    // "HORARIO TÉCNICO"; promoting it to a typed prop restores the
    // single-source-of-truth contract shared with the SERVICIOS/EMPRESA
    // column titles (design.md § Decision 2).
    expectTypeOf<SiteFooterProps['scheduleTitle']>().toEqualTypeOf<string>();
  });

  it('SITE_FOOTER_CONTENT is assignable to the updated SiteFooterProps', () => {
    // The config constant must still satisfy the widened `SiteFooterProps`
    // after `scheduleTitle` is added and `hours` is widened to string[].
    expectTypeOf<typeof SITE_FOOTER_CONTENT>().toMatchTypeOf<SiteFooterProps>();
  });

  it('socialLinks reuses the SocialLink contract from top-header (design.md Decision 4)', () => {
    // The footer MUST NOT introduce a parallel social type: `socialLinks`
    // reuses the exact `SocialLink` interface consumed by `TopHeader.astro`.
    expectTypeOf<SiteFooterProps['socialLinks']>().toEqualTypeOf<
      readonly SocialLink[]
    >();

    // A SocialLink value is constructible in the footer's props position.
    const link: SocialLink = { name: 'Instagram', href: 'https://instagram.com/riff' };
    expect(link.name).toBe('Instagram');
    expect(link.href).toBe('https://instagram.com/riff');
  });

  it('SiteFooterProps collection fields are readonly arrays', () => {
    expectTypeOf<SiteFooterProps['columns']>().toEqualTypeOf<
      readonly FooterColumn[]
    >();
    expectTypeOf<SiteFooterProps['schedule']>().toEqualTypeOf<
      readonly FooterScheduleEntry[]
    >();
  });
});