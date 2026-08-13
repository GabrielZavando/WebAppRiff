import { describe, it, expectTypeOf, expect } from 'vitest';
import type {
  PanelStat,
  PanelCta,
  PanelHomeProps,
} from '@/lib/types/panel-home';

/**
 * Type-level tests for the panel-home type contract.
 *
 * These interfaces are purely declarative (no runtime code is emitted by
 * `import type`), so the actual contract verification happens at TypeScript
 * compile time via `npm run typecheck` (tsc) — if the module path or any of
 * the referenced interfaces do not exist, typecheck fails.
 *
 * Vitest still executes these tests at runtime so we get a smoke check that:
 *   1. the import path resolves (esbuild fails if the file is missing in
 *      `import type` only under specific bundler configs; with `expectTypeOf`
 *      the type-level assertion is materialised and tsc will catch a missing
 *      module during `npm run typecheck`),
 *   2. a runtime value of the expected shape can be constructed (proving the
 *      field names exist and accept the right kinds of values).
 *
 * The deeper behavioural assertions (4 stats, `/contacto` href, uppercase
 * labels, etc.) live in `lib/config/__tests__/panel-home.test.ts` against
 * `PANEL_HOME_CONTENT`, which is the runtime carrier of the contract.
 */
describe('panel-home.ts types', () => {
  it('PanelStat exposes readonly value+label+numericValue', () => {
    const stat: PanelStat = {
      value: '40+',
      label: 'AÑOS DE EXPERIENCIA',
      numericValue: 40,
    };
    expect(stat.value).toBe('40+');
    expect(stat.label).toBe('AÑOS DE EXPERIENCIA');
    // numericValue is the integer target used by the count-up animation.
    expect(typeof stat.numericValue).toBe('number');
    expect(stat.numericValue).toBe(40);
    expectTypeOf<PanelStat>().toEqualTypeOf<{
      readonly value: string;
      readonly label: string;
      readonly numericValue: number;
    }>();
  });

  it('PanelCta constrains label+href strings and a primary/secondary variant', () => {
    const primary: PanelCta = {
      label: 'SOLICITAR ASESORÍA TÉCNICA',
      href: '/contacto',
      variant: 'primary',
    };
    const secondary: PanelCta = {
      label: 'OTRO CTA',
      href: '/otro',
      variant: 'secondary',
    };
    expect(primary.label).toBe('SOLICITAR ASESORÍA TÉCNICA');
    expect(primary.href).toBe('/contacto');
    expect(primary.variant).toBe('primary');
    expect(secondary.variant).toBe('secondary');
    expectTypeOf<PanelCta>().toEqualTypeOf<{
      readonly label: string;
      readonly href: string;
      readonly variant: 'primary' | 'secondary';
    }>();
  });

  it('PanelHomeProps accepts all required fields', () => {
    const props: PanelHomeProps = {
      eyebrow: 'DESDE 1979',
      headline:
        'Más de 40 Años de Liderazgo en la Medición y Control de Fluidos',
      description: 'Nuestra historia comienza...',
      cta: {
        label: 'SOLICITAR ASESORÍA TÉCNICA',
        href: '/contacto',
        variant: 'primary',
      },
      stats: [
        { value: '40+', label: 'AÑOS DE EXPERIENCIA EN LA INDUSTRIA', numericValue: 40 },
        { value: '30.000+', label: 'EQUIPOS Y SOLUCIONES IMPLEMENTADAS', numericValue: 30000 },
        { value: '5+', label: 'MARCAS GLOBALES REPRESENTADAS', numericValue: 5 },
        { value: '9+', label: 'LÍNEAS DE SOLUCIONES INDUSTRIALES', numericValue: 9 },
      ],
    };
    expect(props.eyebrow).toBe('DESDE 1979');
    expect(props.headline).toContain('Más de 40 Años');
    expect(props.cta.href).toBe('/contacto');
    expect(props.stats).toHaveLength(4);
    expectTypeOf<PanelHomeProps>().toEqualTypeOf<{
      readonly eyebrow: string;
      readonly headline: string;
      readonly description: string;
      readonly cta: PanelCta;
      readonly stats: readonly PanelStat[];
    }>();
  });

  it('PanelHomeProps.stats is a readonly array', () => {
    const props: PanelHomeProps = {
      eyebrow: 'DESDE 1979',
      headline: 'h',
      description: 'd',
      cta: { label: 'l', href: '/h', variant: 'primary' },
      stats: [],
    };
    // Runtime check: the array exists and has length 0
    expect(props.stats).toEqual([]);
    expectTypeOf<PanelHomeProps['stats']>().toEqualTypeOf<
      readonly PanelStat[]
    >();
  });
});
