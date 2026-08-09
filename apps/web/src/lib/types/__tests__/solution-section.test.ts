import { describe, it, expectTypeOf, expect } from 'vitest';
import type {
  SolutionIconName,
  Solution,
  SolutionSectionProps,
} from '@/lib/types/solution-section';

/**
 * Type-level tests for the solution-section type contract.
 *
 * These interfaces are purely declarative (no runtime code is emitted by
 * `import type`), so the actual contract verification happens at TypeScript
 * compile time via `npm run typecheck` (tsc) — if the module path or any of
 * the referenced interfaces do not exist, typecheck fails.
 *
 * Vitest still executes these tests at runtime so we get a smoke check that:
 *   1. the import path resolves (esbuild fails if the file is missing when
 *      `expectTypeOf` materialises the type-level assertion; tsc catches a
 *      missing module during `npm run typecheck`),
 *   2. a runtime value of the expected shape can be constructed (proving the
 *      field names exist and accept the right kinds of values), including the
 *      Lucide icon union `SolutionIconName`.
 *
 * The deeper behavioural assertions (exactly 4 solutions, `/soluciones` href,
 * icon order, etc.) live in `lib/config/__tests__/solution-section.test.ts`
 * against `SOLUTION_SECTION_CONTENT`, which is the runtime carrier of the
 * contract.
 *
 * See `design.md` § Decision 10 (`SOLUTION_SECTION_CONTENT` + `SOLUTIONS_DATA`
 * as Readonly<...>) and § Decision 11 (`SolutionIconName` as a closed string
 * union, NOT a free `string`, so typos like `'gauges'` break at compile time
 * instead of rendering an empty icon at runtime).
 */
describe('solution-section.ts types', () => {
  it('SolutionIconName is a closed union of the 4 allowed Lucide names', () => {
    const gauge: SolutionIconName = 'gauge';
    const droplet: SolutionIconName = 'droplet';
    const flask: SolutionIconName = 'flask-conical';
    const settings: SolutionIconName = 'settings-2';

    expect([gauge, droplet, flask, settings]).toEqual([
      'gauge',
      'droplet',
      'flask-conical',
      'settings-2',
    ]);
    // Type-level: the union must be exactly these 4 literals, no extras, no
    // generic `string`. If a consumer assigns a typo (e.g. 'gauges') the tsc
    // compile-time check fails, which is the whole point of Decision 11.
    expectTypeOf<SolutionIconName>().toEqualTypeOf<
      'gauge' | 'droplet' | 'flask-conical' | 'settings-2'
    >();
  });

  it('Solution exposes readonly slug, title, description, image (ImageMetadata), imageAlt, icon and href', () => {
    // Minimal runtime construction proving the field names and value kinds
    // are accepted by the contract. The `image` field uses a stub that
    // satisfies the `ImageMetadata` shape (imported from `astro:assets`);
    // the real import lives in `lib/config/solution-section.ts` so the
    // placeholder here only needs to be structurally compatible.
    const solution: Solution = {
      slug: 'medicion-de-fluidos',
      title: 'Medición de Fluidos',
      description: 'Equipos y soluciones para medir caudal con precisión.',
      image: {
        src: '/assets/img/solucion-medicion.webp',
        width: 800,
        height: 600,
        format: 'webp',
      } as unknown as Solution['image'],
      imageAlt: 'Equipos de medición de fluidos en planta industrial',
      icon: 'gauge',
      href: '/soluciones',
    };

    expect(solution.slug).toBe('medicion-de-fluidos');
    expect(solution.title).toBe('Medición de Fluidos');
    expect(solution.description).toContain('caudal');
    expect(solution.imageAlt).toContain('medición');
    expect(solution.icon).toBe('gauge');
    expect(solution.href).toBe('/soluciones');

    // Type-level shape: every required field present, all readonly.
    expectTypeOf<Solution>().toEqualTypeOf<{
      readonly slug: string;
      readonly title: string;
      readonly description: string;
      readonly image: Solution['image'];
      readonly imageAlt: string;
      readonly icon: SolutionIconName;
      readonly href: string;
    }>();
  });

  it('Solution.icon is narrowed to SolutionIconName, not a free string', () => {
    // Type-level: the `icon` field MUST be the union, not `string`. This is
    // the compile-time guard described in design.md § Decision 11 — a typo
    // like `'gauges'` would fail to compile in lib/config/solution-section.ts
    // before reaching runtime. The exact `toEqualTypeOf` assertion
    // materialises the union at compile time; if the field were declared as
    // `string`, tsc would report a type mismatch here.
    expectTypeOf<Solution['icon']>().toEqualTypeOf<SolutionIconName>();
  });

  it('SolutionSectionProps exposes readonly eyebrow, headline, description and solutions (readonly Solution[])', () => {
    const props: SolutionSectionProps = {
      eyebrow: 'PORTAFOLIO',
      headline: 'Nuestras Soluciones',
      description:
        'Sistemas integrales para el control preciso de fluidos y procesos químicos industriales.',
      solutions: [
        {
          slug: 'medicion-de-fluidos',
          title: 'Medición de Fluidos',
          description: 'desc 1',
          image: { src: '/a.webp', width: 1, height: 1, format: 'webp' } as unknown as Solution['image'],
          imageAlt: 'alt 1',
          icon: 'gauge',
          href: '/soluciones',
        },
      ],
    };

    expect(props.eyebrow).toBe('PORTAFOLIO');
    expect(props.headline).toBe('Nuestras Soluciones');
    expect(props.solutions).toHaveLength(1);
    expect(props.solutions[0]?.title).toBe('Medición de Fluidos');

    // Type-level shape, including the readonly array guard from Decision 10.
    expectTypeOf<SolutionSectionProps>().toEqualTypeOf<{
      readonly eyebrow: string;
      readonly headline: string;
      readonly description: string;
      readonly solutions: readonly Solution[];
    }>();
  });

  it('SolutionSectionProps.solutions is a readonly array', () => {
    const props: SolutionSectionProps = {
      eyebrow: 'e',
      headline: 'h',
      description: 'd',
      solutions: [],
    };
    // Runtime check: the array exists and has length 0
    expect(props.solutions).toEqual([]);
    expectTypeOf<SolutionSectionProps['solutions']>().toEqualTypeOf<
      readonly Solution[]
    >();
  });
});
