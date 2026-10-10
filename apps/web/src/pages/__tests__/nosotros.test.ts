import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosPage from '@/pages/nosotros.astro';

/**
 * Page-level contract for `/nosotros` (change `nosotros-page`).
 *
 * SC-108 (shared chrome) is preserved from the original spec: one `<header>`
 * landmark, the site `<footer>`, no hero image (`hero={false}`) and no search
 * form (`showSearch={false}`). SC-109 evolves: `<main>` is no longer empty —
 * it renders the six institutional sections (SC-201 … SC-207) with the
 * cross-cutting invariants SC-208 … SC-212 (real routes, Lucide-only icons,
 * design tokens, responsive markup and accessibility).
 */
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripTags(html: string): string {
  return unescapeHtml(stripComments(html).replace(/<[^>]+>/g, ''));
}

async function render(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosPage, {});
}

describe('Nosotros page — shared chrome (SC-108)', () => {
  it('renders exactly one <header> landmark, the site <footer> and the main nav', async () => {
    const clean = stripComments(await render());
    expect((clean.match(/<header/g) ?? []).length).toBe(1);
    expect(clean).toContain('<footer');
    expect(clean).toContain('Navegación principal');
  });

  it('keeps hero={false} (no banner_home) and showSearch={false} (no search form)', async () => {
    const clean = stripComments(await render());
    expect(clean).not.toContain('banner_home');
    expect(clean).not.toContain('role="search"');
  });
});

describe('Nosotros page — main renders the six sections (SC-109, SC-201 … SC-207)', () => {
  it('renders a labelled <main> containing the six institutional sections', async () => {
    const clean = stripComments(await render());
    const mainMatch = clean.match(
      /<main[^>]*aria-label="Contenido de Nosotros"[^>]*>([\s\S]*?)<\/main>/,
    );
    if (!mainMatch) throw new Error('<main aria-label="Contenido de Nosotros"> not found');
    const main = mainMatch[1] ?? '';
    expect(main.trim().length).toBeGreaterThan(0);
    expect((main.match(/<section/g) ?? []).length).toBe(6);
  });

  it('renders the hero h1 "SOMOS RIFF" (exactly one h1 on the page)', async () => {
    const clean = stripComments(await render());
    const h1s = clean.match(/<h1[\s\S]*?<\/h1>/g) ?? [];
    expect(h1s).toHaveLength(1);
    const text = stripTags(clean);
    expect(text).toContain('SOMOS');
    expect(text).toContain('RIFF');
  });

  it('renders the #historia anchor target with the five milestone years (SC-203)', async () => {
    const clean = stripComments(await render());
    expect(clean).toMatch(/<[^>]+id="historia"/);
    const text = stripTags(clean);
    expect(text).toContain('AÑO 1979');
    expect(text).toContain('AÑO 2012');
    expect(text).toContain('AÑO 2013');
    expect(text).toContain('AÑO 2018');
    expect(text).toContain('DICIEMBRE 2024');
  });

  it('renders MISIÓN / VISIÓN, the four team members and the eight clients (SC-204 … SC-207)', async () => {
    const text = stripTags(await render());
    expect(text).toContain('MISIÓN');
    expect(text).toContain('VISIÓN');
    expect(text).toContain('Steven Marks');
    expect(text).toContain('Lara Smith');
    expect(text).toContain('John Doe');
    expect(text).toContain('Felipe Román');
    expect(text).toContain('ANGLO AMERICAN');
    expect(text).toContain('SALFACORP');
    expect(text).toContain(
      '¿Listo para optimizar la medición y el flujo de su operación?',
    );
  });

  it('renders the four pillars and four sectors of the value proposition (SC-204)', async () => {
    const text = stripTags(await render());
    expect(text).toContain('Durabilidad Extrema');
    expect(text).toContain('Servicio In-Situ');
    expect(text).toContain('SECTOR 01');
    expect(text).toContain('Edificación & Inmobiliario');
  });
});

describe('Nosotros page — CTAs and in-page navigation (SC-208)', () => {
  it('renders advisory CTAs with the real /contacto route and never #contacto', async () => {
    const clean = stripComments(await render());
    expect(clean).not.toContain('href="#contacto"');
    const contactoAnchors =
      clean.match(/<a[^>]*href="\/contacto"[^>]*>/g) ?? [];
    expect(contactoAnchors.length).toBeGreaterThanOrEqual(2); // hero + banner
  });

  it('renders the #historia anchor pointing at an existing id target', async () => {
    const clean = stripComments(await render());
    expect(clean).toMatch(/<a[^>]*href="#historia"[^>]*>/);
    expect(clean).toMatch(/<[^>]+id="historia"/);
  });

  it('renders no page-owned smooth-scroll script', async () => {
    const clean = stripComments(await render());
    expect(clean).not.toContain('scrollIntoView');
    expect(clean).not.toMatch(/<script[^>]*>[\s\S]*smooth[\s\S]*?<\/script>/i);
  });
});

describe('Nosotros page — icon set (SC-209)', () => {
  it('uses lucide: icons and contains no material-symbols reference', async () => {
    const clean = stripComments(await render());
    expect(clean).toContain('lucide:');
    expect(clean).toContain('lucide:arrow-right');
    expect(clean).toContain('lucide:phone');
    expect(clean).not.toContain('material-symbols');
  });

  it('renders the decorative icons of the six sections with aria-hidden="true"', async () => {
    const clean = stripComments(await render());
    // Scoped to <main>: the shared chrome owns its own icon markup.
    const main = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    const svgs = main.match(/<svg[^>]*data-icon="lucide:[^"]*"[^>]*>/g) ?? [];
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg).toContain('aria-hidden="true"');
    }
  });
});

describe('Nosotros page — design tokens and flat design (SC-210)', () => {
  it('contains no hex literal in any class attribute', async () => {
    const clean = stripComments(await render());
    const classes = clean.match(/class="[^"]*"/g) ?? [];
    expect(classes.length).toBeGreaterThan(0);
    for (const classAttr of classes) {
      expect(classAttr).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    }
  });

  it('contains no rounded utility in any class attribute', async () => {
    const clean = stripComments(await render());
    const classes = clean.match(/class="[^"]*"/g) ?? [];
    for (const classAttr of classes) {
      expect(classAttr).not.toMatch(/rounded/);
    }
  });
});

describe('Nosotros page — accessibility invariants (SC-212)', () => {
  it('gives every image of the six sections a non-empty alt (SC-212)', async () => {
    const clean = stripComments(await render());
    // Scoped to <main>: hero + 4 portraits. Chrome images (logos) have their
    // own alt contract in the header/footer specs.
    const main = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? '';
    const images = main.match(/<img[^>]*>/g) ?? [];
    expect(images.length).toBe(5);
    for (const img of images) {
      expect(img).toMatch(/alt="[^"]+"/);
    }
  });

  it('keeps the heading hierarchy: one h1, section h2s and card h3/h4s', async () => {
    const clean = stripComments(await render());
    expect((clean.match(/<h1/g) ?? []).length).toBe(1);
    expect((clean.match(/<h2/g) ?? []).length).toBeGreaterThanOrEqual(6);
    expect((clean.match(/<h3/g) ?? []).length).toBeGreaterThan(0);
    expect((clean.match(/<h4/g) ?? []).length).toBeGreaterThan(0);
  });
});
