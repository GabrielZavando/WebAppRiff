import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import NosotrosClientsCarousel from '@/components/NosotrosClientsCarousel.astro';
import {
  CLIENT_LOGOS,
  CLIENTS_CAROUSEL_DURATION_SECONDS,
} from '@/lib/config/nosotros-clients';

const COMPONENT_PATH = new URL(
  '../NosotrosClientsCarousel.astro',
  import.meta.url,
);

async function render(
  logos = CLIENT_LOGOS,
  durationSeconds = CLIENTS_CAROUSEL_DURATION_SECONDS,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(NosotrosClientsCarousel, {
    props: { logos, durationSeconds },
  });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function readComponentSource(): string {
  return readFileSync(COMPONENT_PATH, 'utf-8');
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Behavioural contract for `NosotrosClientsCarousel.astro` (change
 * `nosotros-clients-carousel`): dual-copy CSS marquee with the second copy
 * hidden from assistive tech, astro:assets WebP logos with non-empty alt and
 * lazy loading, CSS-only pause on hover, GPU-composited `scale3d` zoom and
 * `prefers-reduced-motion` support.
 */
describe('NosotrosClientsCarousel — duplicated marquee track', () => {
  it('renders two copies of the 41 logos (82 images in total)', async () => {
    const html = await render();
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images).toHaveLength(CLIENT_LOGOS.length * 2);
    expect(html.match(/<ul[\s>]/g) ?? []).toHaveLength(2);
  });

  it('hides the duplicated copy from assistive technology', async () => {
    const html = await render();
    expect(html).toMatch(/<ul[^>]*aria-hidden="true"/);
  });

  it('exposes the carousel as a labelled group with an overflow-hidden viewport', async () => {
    const html = await render();
    expect(html).toMatch(/role="group"/);
    expect(html).toMatch(/aria-label="Logos de clientes"/);
    expect(html).toMatch(/class="[^"]*\boverflow-hidden\b[^"]*"/);
  });
});

describe('NosotrosClientsCarousel — images (image-assets)', () => {
  it('renders every logo through astro:assets with lazy loading and a non-empty alt', async () => {
    const html = await render();
    const images = html.match(/<img[^>]*>/g) ?? [];
    for (const img of images) {
      expect(img).toMatch(/src="\/_(astro|image)\?/);
      expect(img).not.toContain('/src/assets/');
      expect(img).toMatch(/alt="[^"]+"/);
      expect(img).toContain('loading="lazy"');
    }
  });

  it('renders the client names as alts in alphabetical order', async () => {
    const html = await render();
    const alts = [...html.matchAll(/<img[^>]*alt="([^"]+)"/g)].map(
      (match) => unescapeHtml(match[1] ?? ''),
    );
    const firstCopy = alts.slice(0, CLIENT_LOGOS.length);
    expect(firstCopy).toEqual(CLIENT_LOGOS.map((logo) => logo.alt));
    expect(firstCopy[0]).toBe('ACF Minera');
  });

  it('renders each logo complete with a proportional width and a uniform height', async () => {
    const html = await render();
    const sizes = (html.match(/<img[^>]*>/g) ?? []).map((img) => ({
      width: Number(img.match(/\bwidth="(\d+)"/)?.[1]),
      height: Number(img.match(/\bheight="(\d+)"/)?.[1]),
    }));
    expect(sizes).toHaveLength(CLIENT_LOGOS.length * 2);
    const renderedHeight = sizes[0]!.height;
    expect(renderedHeight).toBeGreaterThan(0);
    expect(new Set(sizes.map((size) => size.height))).toEqual(
      new Set([renderedHeight]),
    );

    for (let copy = 0; copy < 2; copy += 1) {
      for (const [index, logo] of CLIENT_LOGOS.entries()) {
        const { width } = sizes[copy * CLIENT_LOGOS.length + index]!;
        const expectedWidth = Math.round(
          (logo.image.width / logo.image.height) * renderedHeight,
        );
        expect(width).toBe(expectedWidth);
      }
    }
  });

  it('gives every logo card a white background', async () => {
    const html = await render();
    const items = html.match(/<li[^>]*>/g) ?? [];
    expect(items).toHaveLength(CLIENT_LOGOS.length * 2);
    for (const item of items) {
      expect(item).toContain('bg-white');
    }
  });
});

describe('NosotrosClientsCarousel — CSS-only animation', () => {
  it('declares the linear infinite marquee with the configured duration', async () => {
    const html = await render();
    const source = readComponentSource();
    expect(html).toContain('--clients-carousel-duration: 120s');
    expect(source).toMatch(/animation:\s*clients-carousel-scroll[^;]*linear infinite/);
    expect(source).toMatch(/translate3d\(-50%,\s*0,\s*0\)/);
    expect(source).toMatch(/--clients-carousel-duration/);
  });

  it('spaces items with margin-right (not flex gap) to keep the loop seamless', () => {
    const source = readComponentSource();
    expect(source).toMatch(/\.clients-carousel__item[\s\S]*?margin-right:/);
    expect(source).not.toMatch(/\bgap-[\w-]+/);
  });

  it('sizes each cell by the logo instead of a fixed-width box', () => {
    const source = readComponentSource();
    const itemBlock =
      source.match(/\.clients-carousel__item\s*\{([\s\S]*?)\}/)?.[1] ?? '';
    expect(itemBlock).toMatch(/height:\s*6\.5rem/);
    expect(itemBlock).toMatch(/padding:\s*0\.75rem/);
    expect(itemBlock).not.toMatch(/width:\s*[\d.]+rem/);
    expect(source).toMatch(
      /\.clients-carousel__logo\s*\{[\s\S]*?width:\s*auto/,
    );
  });

  it('measures 120px tall including padding on desktop', () => {
    const source = readComponentSource();
    expect(source).toMatch(/@media\s*\(min-width:\s*768px\)/);
    expect(source).toMatch(/height:\s*7\.5rem/);
    expect(source).toMatch(/padding:\s*1rem/);
  });

  it('pauses on hover via animation-play-state', () => {
    const source = readComponentSource();
    expect(source).toMatch(/:hover[\s\S]*?animation-play-state:\s*paused/);
  });

  it('adds vertical room so the enlarged logo is not clipped by the viewport', () => {
    const source = readComponentSource();
    expect(source).toMatch(
      /\.clients-carousel\s*\{[\s\S]*?padding-block:\s*0\.5rem/,
    );
  });

  it('zooms the logo image on hover while the white card keeps its size', () => {
    const source = readComponentSource();
    const hoverBlock =
      source.match(
        /\.clients-carousel__item:hover\s+\.clients-carousel__logo[^{]*\{([\s\S]*?)\}/,
      )?.[1] ?? '';
    expect(hoverBlock).toMatch(/scale3d\(1\.05,\s*1\.05,\s*1\)/);
    expect(hoverBlock).toMatch(/will-change:\s*transform/);
    const itemHoverBlock =
      source.match(/\.clients-carousel__item:hover\s*\{([\s\S]*?)\}/)?.[1] ??
      '';
    expect(itemHoverBlock).not.toMatch(/scale3d/);
  });

  it('never uses the standalone scale property nor the scale-105 utility', async () => {
    const source = readComponentSource();
    const html = stripComments(await render());
    expect(source).not.toMatch(/(^|[\s;{])scale\s*:/m);
    expect(html).not.toContain('scale-105');
  });

  it('stops the animation under prefers-reduced-motion', () => {
    const source = readComponentSource();
    expect(source).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(source).toMatch(/animation:\s*none/);
  });
});

describe('NosotrosClientsCarousel — design tokens', () => {
  it('renders no rounded utilities and no hex literals', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/rounded/);
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
