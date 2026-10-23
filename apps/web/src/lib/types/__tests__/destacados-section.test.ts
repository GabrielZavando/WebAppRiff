import { describe, it, expectTypeOf, expect } from 'vitest';
import type {
  FeaturedProduct,
  DestacadosSectionProps,
} from '@/lib/types/destacados-section';

/**
 * Type-level tests for the destacados-section type contract.
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
 * The deeper behavioural assertions (exactly 4 products, exact titles in
 * order, image imports, kebab-case slugs, no price fields at runtime) live in
 * `lib/config/__tests__/destacados-section.test.ts` against
 * `DESTACADOS_SECTION_CONTENT`, which is the runtime carrier of the contract.
 *
 * See `design.md` § Decision 3 (`FeaturedProduct` intentionally carries NO
 * price fields — the client specified the section shows no prices, and adding
 * unused fields would violate "never implement more than the task asks") and
 * § Decision 1 (dumb component contract: all data arrives via props).
 */
describe('destacados-section.ts types', () => {
  it('FeaturedProduct exposes readonly id, titulo, slug, imageUrl and imagenAlt', () => {
    // Minimal runtime construction proving the field names and value kinds
    // are accepted by the contract. `imageUrl` is a REMOTE image URL taken
    // from the backend card gallery (`galeria[0].url`, Firebase Storage) —
    // the featured contract no longer references local `assets/img/`
    // metadata (see change `home-featured-products-grid`, design.md
    // § Decision 3/4).
    const product: FeaturedProduct = {
      id: 'flujometro-universal',
      titulo: 'Flujómetro Universal',
      slug: 'flujometro-universal',
      imageUrl: 'https://storage.googleapis.com/riff/flujometro.webp',
      imagenAlt: 'Flujómetro universal de alta precisión',
    };

    expect(product.id).toBe('flujometro-universal');
    expect(product.titulo).toBe('Flujómetro Universal');
    expect(product.slug).toBe('flujometro-universal');
    expect(product.imageUrl).toContain('https://');
    expect(product.imagenAlt).toContain('Flujómetro');

    // Type-level shape: every required field present, all readonly.
    expectTypeOf<FeaturedProduct>().toEqualTypeOf<{
      readonly id: string;
      readonly titulo: string;
      readonly slug: string;
      readonly imageUrl: string;
      readonly imagenAlt: string;
    }>();
  });

  it('FeaturedProduct carries NO price fields (design.md Decision 3)', () => {
    // Type-level guard: the client explicitly decided the section shows no
    // prices. A `precio` / `precioVisible` / `price` field MUST NOT exist on
    // the contract — if someone adds one, `.not.toHaveProperty` breaks the
    // build, surfacing the deviation from the declared design.
    expectTypeOf<FeaturedProduct>().not.toHaveProperty('precio');
    expectTypeOf<FeaturedProduct>().not.toHaveProperty('precioVisible');
    expectTypeOf<FeaturedProduct>().not.toHaveProperty('price');
  });

  it('DestacadosSectionProps exposes readonly headline, ctaText, ctaHref and products (readonly FeaturedProduct[])', () => {
    const props: DestacadosSectionProps = {
      headline: 'Soluciones Destacadas',
      ctaText: 'EXPLORAR CATÁLOGO COMPLETO',
      ctaHref: '/productos',
      products: [
        {
          id: 'antiincrustante-bimaks-420',
          titulo: 'Antiincrustante Bimaks 420 para Ósmosis Inversa (Agua Salobre)',
          slug: 'antiincrustante-bimaks-420',
          imageUrl: 'https://storage.googleapis.com/riff/bimaks-420.webp',
          imagenAlt: 'Bidón azul de antiincrustante Bimaks 420',
        },
      ],
    };

    expect(props.headline).toBe('Soluciones Destacadas');
    expect(props.ctaText).toBe('EXPLORAR CATÁLOGO COMPLETO');
    expect(props.ctaHref).toBe('/productos');
    expect(props.products).toHaveLength(1);
    expect(props.products[0]?.titulo).toContain('Bimaks');
    expect(props.products[0]?.imageUrl).toContain('https://');

    // Type-level shape, including the readonly array guard.
    expectTypeOf<DestacadosSectionProps>().toEqualTypeOf<{
      readonly headline: string;
      readonly ctaText: string;
      readonly ctaHref: string;
      readonly products: readonly FeaturedProduct[];
    }>();
  });

  it('DestacadosSectionProps.products is a readonly array', () => {
    const props: DestacadosSectionProps = {
      headline: 'h',
      ctaText: 'c',
      ctaHref: '/productos',
      products: [],
    };
    expect(props.products).toEqual([]);
    expectTypeOf<DestacadosSectionProps['products']>().toEqualTypeOf<
      readonly FeaturedProduct[]
    >();
  });
});