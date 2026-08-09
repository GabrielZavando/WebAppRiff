import { describe, it, expectTypeOf, expect } from 'vitest';
import type {
  PilarIconName,
  Pilar,
  PilaresCta,
  PilaresSectionProps,
} from '@/lib/types/pilares-section';

/**
 * Type-level tests for the pilares-section type contract.
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
 * The deeper behavioural assertions (exact copy, exactly 4 pillars with
 * labels/icons in order, image imports, non-empty descriptive alts, no price
 * fields at runtime) live in `lib/config/__tests__/pilares-section.test.ts`
 * against `PILARES_SECTION_CONTENT`, which is the runtime carrier of the
 * contract.
 *
 * See `design.md` § Decision 5 (`PilarIconName` is a closed union, NOT a free
 * `string`: a typo like `'recicle'` breaks at compile time instead of
 * rendering an empty icon at runtime — same rationale as `SolutionIconName`,
 * consumed via `astro-icon` as `lucide:<name>`) and § Decision 1 (dumb
 * component contract: all data arrives via props).
 */
describe('pilares-section.ts types', () => {
  it('PilarIconName is a closed union of the 4 verified Lucide names', () => {
    expectTypeOf<PilarIconName>().toEqualTypeOf<
      'recycle' | 'clock' | 'monitor' | 'headphones'
    >();

    // Every member is assignable (proves the union isn't empty/over-restricted).
    const recycle: PilarIconName = 'recycle';
    const clock: PilarIconName = 'clock';
    const monitor: PilarIconName = 'monitor';
    const headphones: PilarIconName = 'headphones';
    expect([recycle, clock, monitor, headphones]).toEqual([
      'recycle',
      'clock',
      'monitor',
      'headphones',
    ]);
  });

  it('Pilar exposes readonly label and icon (PilarIconName)', () => {
    const pillar: Pilar = {
      label: 'Sostenibilidad',
      icon: 'recycle',
    };

    expect(pillar.label).toBe('Sostenibilidad');
    expect(pillar.icon).toBe('recycle');

    expectTypeOf<Pilar>().toEqualTypeOf<{
      readonly label: string;
      readonly icon: PilarIconName;
    }>();
  });

  it('PilaresCta exposes readonly label and href', () => {
    const cta: PilaresCta = {
      label: 'HABLEMOS DE TU PROYECTO',
      href: '/contacto',
    };

    expect(cta.label).toBe('HABLEMOS DE TU PROYECTO');
    expect(cta.href).toBe('/contacto');

    expectTypeOf<PilaresCta>().toEqualTypeOf<{
      readonly label: string;
      readonly href: string;
    }>();
  });

  it('PilaresSectionProps exposes the full readonly contract', () => {
    const props: PilaresSectionProps = {
      eyebrow: 'Sostenibilidad y Eficiencia',
      headline: 'Comprometidos con la Optimización de Recursos',
      description: 'Empresa especializada en medición de fluidos.',
      cta: { label: 'HABLEMOS DE TU PROYECTO', href: '/contacto' },
      rightEyebrow: 'Estándares de Calidad',
      rightHeadline: 'Nuestros Pilares de Excelencia',
      rightDescription: 'Equipos de alta precisión y durabilidad.',
      pillars: [{ label: 'Sostenibilidad', icon: 'recycle' }],
      leftImage: {
        src: '/assets/img/sostenibilidad-edificios.jpg',
        width: 1600,
        height: 1067,
        format: 'jpg',
      } as unknown as PilaresSectionProps['leftImage'],
      leftImageAlt: 'Edificios corporativos con diseño sostenible',
    };

    expect(props.eyebrow).toBe('Sostenibilidad y Eficiencia');
    expect(props.headline).toContain('Optimización de Recursos');
    expect(props.cta.href).toBe('/contacto');
    expect(props.rightEyebrow).toBe('Estándares de Calidad');
    expect(props.pillars).toHaveLength(1);
    expect(props.pillars[0]?.icon).toBe('recycle');
    expect(props.leftImageAlt).toMatch(/edificios/i);

    expectTypeOf<PilaresSectionProps>().toEqualTypeOf<{
      readonly eyebrow: string;
      readonly headline: string;
      readonly description: string;
      readonly cta: PilaresCta;
      readonly rightEyebrow: string;
      readonly rightHeadline: string;
      readonly rightDescription: string;
      readonly pillars: readonly Pilar[];
      readonly leftImage: PilaresSectionProps['leftImage'];
      readonly leftImageAlt: string;
    }>();
  });

  it('PilaresSectionProps.pillars is a readonly array', () => {
    const props: PilaresSectionProps = {
      eyebrow: 'e',
      headline: 'h',
      description: 'd',
      cta: { label: 'l', href: '/contacto' },
      rightEyebrow: 're',
      rightHeadline: 'rh',
      rightDescription: 'rd',
      pillars: [],
      leftImage: {} as unknown as PilaresSectionProps['leftImage'],
      leftImageAlt: 'a',
    };
    expect(props.pillars).toEqual([]);
    expectTypeOf<PilaresSectionProps['pillars']>().toEqualTypeOf<
      readonly Pilar[]
    >();
  });

  it('PilarIconName rejects an arbitrary string (closed union, design.md Decision 5)', () => {
    // @ts-expect-error — 'recicle' is a typo: the closed union must reject it
    // at compile time instead of rendering an empty icon at runtime.
    const invalid: PilarIconName = 'recicle';
    expect(invalid).toBe('recicle');
  });
});