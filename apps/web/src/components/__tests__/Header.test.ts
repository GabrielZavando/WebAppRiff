import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Header from '@/components/Header.astro';
import { NAVIGATION_ITEMS } from '@/lib/config/navigation';
import type { HeaderProps } from '@/lib/types/header';

const baseProps: HeaderProps = {
  items: NAVIGATION_ITEMS,
  activePath: '/',
  cta: { label: 'SOLICITAR COTIZACIÓN', href: '/cotizacion' },
  logoAlt: 'Riff',
};

async function render(props: HeaderProps = baseProps): Promise<string> {
  const container = await AstroContainer.create();
  // Spread into a fresh literal so the props are assignable to Astro's Props
  // (which carries an index signature for arbitrary attributes).
  return container.renderToString(Header, { props: { ...props } });
}

async function renderTransparent(props: HeaderProps = baseProps): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Header, { props: { ...props, transparent: true } });
}

function getDesktopNav(html: string): string {
  const match = html.match(/<nav aria-label="Navegación principal"[\s\S]*?<\/nav>/);
  if (!match) throw new Error('Desktop nav not found in rendered HTML');
  return match[0];
}

describe('Header', () => {
  it('renders the logo as a home link wrapping the real logo image', async () => {
    const html = await render();

    expect(html).toContain('<a href="/"');
    expect(html).toContain('aria-label="Ir al inicio"');
    // The real logo asset is rendered as an <img> inside the logo link. The
    // regex allows the HTML TODO comment (scroll-animations) to sit between
    // the <a> and the <img>.
    expect(html).toMatch(/<a href="\/" aria-label="Ir al inicio"[^>]*>[\s\S]*?<img/);
    expect(html).toContain('alt="Riff"');
    expect(html).toContain('width="165"');
    expect(html).toContain('height="67"');
    // The placeholder must be gone
    expect(html).not.toContain('Logo placeholder');
    expect(html).not.toContain('w-[165px] h-[80px]');
  });

  it('renders the five navigation items in order', async () => {
    const html = await render();
    const nav = getDesktopNav(html);

    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map(m => m[1] ?? '');
    expect(hrefs).toEqual(['/', '/nosotros', '/servicios', '/representaciones', '/contacto']);

    const labels = [...nav.matchAll(/>([^<>]+)<\/a>/g)].map(m => (m[1] ?? '').trim());
    expect(labels).toEqual(['Inicio', 'Nosotros', 'Servicios', 'Representaciones', 'Contacto']);
  });

  it('marks the item matching activePath with aria-current and orange underline', async () => {
    const html = await render({ ...baseProps, activePath: '/nosotros' });
    const nav = getDesktopNav(html);

    const nosotroItem = nav.match(/<a[^>]*href="\/nosotros"[^>]*>/)?.[0] ?? '';
    expect(nosotroItem).toContain('aria-current="page"');
    expect(nosotroItem).toContain('after:bg-primary');
  });

  it('marks Inicio active only at the root path', async () => {
    const atRoot = await render({ ...baseProps, activePath: '/' });
    const inicioAtRoot = getDesktopNav(atRoot).match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';
    expect(inicioAtRoot).toContain('aria-current="page"');

    const atSection = await render({ ...baseProps, activePath: '/nosotros' });
    const inicioAtSection = getDesktopNav(atSection).match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';
    expect(inicioAtSection).not.toContain('aria-current="page"');
  });

  it('renders the CTA with label, href and accent styling (Montserrat 600, flat)', async () => {
    const html = await render();

    expect(html).toContain('SOLICITAR COTIZACIÓN');
    expect(html).toContain('href="/cotizacion"');
    expect(html).toContain('bg-accent');
    // ui-refactor: the CTA uses Montserrat 600 (font-heading font-semibold),
    // not the old Open Sans 700 (font-bold).
    expect(html).toContain('font-heading');
    expect(html).toContain('font-semibold');
    expect(html).not.toContain('font-bold');
    expect(html).toContain('uppercase');
  });

  it('renders the desktop nav items with Montserrat 600 (font-heading font-semibold)', async () => {
    const html = await render();
    const nav = getDesktopNav(html);

    // Every nav item link carries the heading font + 600 weight per the
    // ui-refactor typographic scale (replacing the old font-medium / Open Sans).
    const navLinks = [...nav.matchAll(/<a[^>]*class="([^"]*)"[^>]*>[^<]+<\/a>/g)];
    expect(navLinks.length).toBeGreaterThan(0);
    for (const m of navLinks) {
      const cls = m[1] ?? '';
      expect(cls, `nav item missing font-heading: "${cls}"`).toContain('font-heading');
      expect(cls, `nav item missing font-semibold: "${cls}"`).toContain('font-semibold');
    }
  });

  it('hides the desktop nav on mobile and exposes a hamburger toggle', async () => {
    const html = await render();

    expect(getDesktopNav(html)).toContain('hidden lg:flex');
    expect(html).toContain('lg:hidden');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="mobile-nav"');
  });

  it('renders the mobile panel with all items initially hidden', async () => {
    const html = await render();

    const panel = html.match(/<div id="mobile-nav"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(panel).toContain('id="mobile-nav"');
    expect(panel).toContain('hidden');

    const labels = [...panel.matchAll(/>([^<>]+)<\/a>/g)].map(m => (m[1] ?? '').trim());
    expect(labels).toEqual(['Inicio', 'Nosotros', 'Servicios', 'Representaciones', 'Contacto']);
  });

  it('meets accessibility requirements', async () => {
    const html = await render();

    expect(html.match(/<header[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<nav aria-label="Navegación principal"');
    expect(html).toContain('aria-label="Ir al inicio"');
    expect(html).toContain('aria-label="Abrir menú"');
    expect(html).toContain('aria-expanded="false"');

    const activeNav = getDesktopNav(await render({ ...baseProps, activePath: '/contacto' }));
    expect(activeNav).toContain('aria-current="page"');
  });

  it('matches the snapshot for full header', async () => {
    const html = await render();
    expect(html).toMatchSnapshot();
  });

  describe('transparent mode (home hero full-bleed background)', () => {
    it('removes the brand navy gradient background in transparent mode', async () => {
      const html = await renderTransparent();

      expect(html).not.toContain('bg-secondary');
      expect(html).not.toContain('from-secondary');
      expect(html).not.toContain('to-secondary-light');
      expect(html).toContain('bg-transparent');
    });

    it('keeps the logo, nav and CTA visible in transparent mode', async () => {
      const html = await renderTransparent();

      expect(html).toContain('aria-label="Ir al inicio"');
      expect(getDesktopNav(html)).toContain('hidden lg:flex');
      expect(html).toContain('SOLICITAR COTIZACIÓN');
    });

    it('defaults to the solid navy gradient when transparent is not set', async () => {
      const html = await render();

      expect(html).toContain('bg-secondary');
      expect(html).toContain('to-secondary-light');
    });
  });
});
