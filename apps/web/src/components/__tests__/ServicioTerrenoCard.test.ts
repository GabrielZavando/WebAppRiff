import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ServicioTerrenoCard from '@/components/ServicioTerrenoCard.astro';
import type { ServicioTerreno } from '@/lib/types/services-page';
import { SERVICIOS_FIELD_SECTION } from '@/lib/config/services-page';

const services = SERVICIOS_FIELD_SECTION.services;
const first = services[0]!;
const second = services[1]!;
const third = services[2]!;

async function render(
  props: Partial<ServicioTerreno> = {},
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ServicioTerrenoCard, {
    props: { ...first, ...props },
  });
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

describe('ServicioTerrenoCard — image and caption', () => {
  it('renders an astro:assets image with lazy loading and descriptive alt', async () => {
    const html = stripComments(await render());
    const img = html.match(/<img[^>]*>/);
    expect(img).not.toBeNull();
    expect(img![0]).toContain('loading="lazy"');
    expect(img![0]).toContain(
      'alt="Edificios residenciales con instalación de medidores de agua"',
    );
    expect(img![0]).not.toMatch(/src="[^"]*(assets\/img|\/@fs\/)/);
    expect(img![0]).toMatch(/src="\/_(astro|image)\?/);
  });

  it('renders the caption over the image with the dark secondary overlay', async () => {
    const html = stripComments(await render());
    const caption = html.match(/<div[^>]*data-image-caption[^>]*>/);
    expect(caption).not.toBeNull();
    expect(caption![0]).toContain('bg-secondary-dark/90');
    expect(html).toContain('COMPATIBILIDAD TELEMÉTRICA');
    expect(html).toContain('Lectura remota por radiofrecuencia');
  });
});

describe('ServicioTerrenoCard — index, sector, title and description', () => {
  it('renders the index as two digits and the sector in accent uppercase', async () => {
    const html = stripComments(await render({ index: 1 }));
    const index = html.match(/<span[^>]*data-service-index[^>]*>[\s\S]*?<\/span>/);
    expect(index).not.toBeNull();
    expect(index![0]).toContain('01');
    expect(index![0]).toContain('RESIDENCIAL &amp; COMERCIAL');
    expect(index![0]).toContain('text-accent');
    expect(index![0]).toContain('uppercase');
  });

  it('renders the title as h3 in text-secondary', async () => {
    const html = stripComments(await render());
    const title = html.match(/<h3[^>]*>[\s\S]*?Medición en Edificios[\s\S]*?<\/h3>/);
    expect(title).not.toBeNull();
    expect(title![0]).toContain('text-secondary');
  });

  it('renders the description in text-text-2', async () => {
    const html = stripComments(await render());
    const description = html.match(/<p[^>]*data-service-description[^>]*>/);
    expect(description).not.toBeNull();
    expect(description![0]).toContain('text-text-2');
  });
});

describe('ServicioTerrenoCard — layout', () => {
  it('renders a single vertical column from md without a 12-column grid', async () => {
    const html = stripComments(await render());
    const article = html.match(/<article[^>]*>/);
    expect(article).not.toBeNull();
    expect(article![0]).toContain('flex flex-col');
    expect(article![0]).not.toContain('md:grid-cols-12');
    expect(html).not.toContain('md:col-span-');
  });

  it('orders header, image and body top-to-bottom from md', async () => {
    const html = stripComments(await render());
    const header = html.match(/<div[^>]*data-service-header[^>]*>/);
    const image = html.match(/<div[^>]*data-service-image[^>]*>/);
    const content = html.match(/<div[^>]*data-service-content[^>]*>/);
    expect(header).not.toBeNull();
    expect(image).not.toBeNull();
    expect(content).not.toBeNull();
    expect(header![0]).toContain('order-2');
    expect(header![0]).toContain('md:order-1');
    expect(image![0]).toContain('order-1');
    expect(image![0]).toContain('md:order-2');
    expect(content![0]).toContain('order-3');
    expect(content![0]).toContain('md:order-3');
  });

  it('renders a full-width 16:9 image without distortion', async () => {
    const html = stripComments(await render());
    const image = html.match(/<div[^>]*data-service-image[^>]*>/);
    const img = html.match(/<img[^>]*>/);
    expect(image).not.toBeNull();
    expect(img).not.toBeNull();
    expect(image![0]).toContain('w-full');
    expect(image![0]).toContain('md:aspect-video');
    expect(img![0]).toContain('object-cover');
    expect(img![0]).toContain('h-full');
    expect(img![0]).toContain('w-full');
  });

  it('places the CTA after the description with space reserved for the FABs', async () => {
    const html = stripComments(await render());
    const cta = html.match(/<div[^>]*data-service-cta[^>]*>/);
    expect(cta).not.toBeNull();
    expect(cta![0]).toContain('md:pr-24');
    const descriptionIndex = html.indexOf('data-service-description');
    const ctaIndex = html.indexOf('data-service-cta');
    expect(descriptionIndex).toBeGreaterThan(-1);
    expect(ctaIndex).toBeGreaterThan(descriptionIndex);
  });
});

describe('ServicioTerrenoCard — body variants', () => {
  it('renders the features variant as two boxes', async () => {
    const html = stripComments(await render(first));
    const features = html.match(/data-feature(?:\s|>)/g) ?? [];
    expect(features).toHaveLength(2);
    expect(html).toContain('Recambio Masivo Programado');
    expect(html).toContain('Plataforma de Facturación');
    expect(html).not.toMatch(/<ul/);
  });

  it('renders the bullets variant as a ul with three items and check icons', async () => {
    const html = stripComments(await render(second));
    const ul = html.match(/<ul[^>]*>([\s\S]*?)<\/ul>/);
    expect(ul).not.toBeNull();
    const items = ul![0].match(/<li/g) ?? [];
    expect(items).toHaveLength(3);
    expect(ul![0]).toContain('Precisión Certificada:');
    expect(ul![0]).toContain('<strong');
    const icons = ul![0].match(/data-icon="circle-check"/g) ?? [];
    expect(icons).toHaveLength(3);
    const ariaHidden = ul![0].match(/aria-hidden="true"/g) ?? [];
    expect(ariaHidden.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the tags variant as five chips and no bullet list', async () => {
    const html = stripComments(await render(third));
    const tags = html.match(/data-tag(?:\s|>)/g) ?? [];
    expect(tags).toHaveLength(5);
    expect(html).not.toMatch(/<ul/);
    expect(html).toContain('Spools &amp; Tuberías HDPE / Acero Carbono');
  });

  it('does not mix body variants', async () => {
    const html = stripComments(await render(second));
    expect(html).not.toContain('data-feature');
    expect(html).not.toContain('data-tag');
  });
});

describe('ServicioTerrenoCard — anchor and CTA', () => {
  it('renders the slug as the article id with a scroll margin', async () => {
    const html = stripComments(await render());
    const article = html.match(/<article[^>]*>/);
    expect(article).not.toBeNull();
    expect(article![0]).toContain('id="medicion-en-edificios"');
    expect(article![0]).toContain('scroll-mt-');
  });

  it('renders the accent CTA to /contacto with a decorative arrow', async () => {
    const html = stripComments(await render());
    const cta = html.match(/<a[^>]*href="\/contacto"[^>]*>/);
    expect(cta).not.toBeNull();
    expect(cta![0]).toContain('bg-accent');
    expect(html).toContain('Contactar a un Especialista');
    expect(html).toMatch(/<svg[^>]*data-icon="arrow-right"[^>]*aria-hidden="true"/);
  });
});

describe('ServicioTerrenoCard — flat design', () => {
  it('does not use rounded or shadow classes', async () => {
    const html = stripComments(await render());
    expect(html).not.toMatch(/class="[^"]*rounded/);
    expect(html).not.toMatch(/class="[^"]*shadow/);
  });
});
