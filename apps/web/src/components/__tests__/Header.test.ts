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

function getMobileNav(html: string): string {
  const match = html.match(/<div id="mobile-nav"[\s\S]*?<\/div>/);
  if (!match) throw new Error('Mobile nav overlay not found in rendered HTML');
  return match[0];
}

describe('Header', () => {
  it('renders the logo as a home link wrapping the real logo image at 2x size with overflow', async () => {
    const html = await render();

    expect(html).toContain('<a href="/"');
    expect(html).toContain('aria-label="Ir al inicio"');
    expect(html).toMatch(/<a href="\/" aria-label="Ir al inicio"[^>]*>[\s\S]*?<img/);
    expect(html).toContain('alt="Riff"');
    // Logo rendered at 2x size (330×134, double of 165×67)
    expect(html).toContain('width="330"');
    expect(html).toContain('height="134"');
    // Logo uses a responsive max-width: scales proportionally up to 200px on
    // mobile and 300px from the sm breakpoint upward (replaces fixed w-[330px]).
    expect(html).toContain('w-full');
    expect(html).toContain('max-w-[200px]');
    expect(html).toContain('sm:max-w-[300px]');
    // Wrapper height is responsive (shorter h-20 on mobile/tablet, h-24 on
    // desktop) and the logo is height-capped so it cannot grow the header.
    expect(html).toContain('h-20');
    expect(html).toContain('lg:h-24');
    expect(html).toContain('max-h-full');
    expect(html).toContain('lg:max-h-none');
    // The <a> wrapper constrains height with overflow-visible so the
    // oversized logo may visually overflow without growing the header container.
    expect(html).toContain('overflow-visible');
    // Placeholder must be gone
    expect(html).not.toContain('Logo placeholder');
    expect(html).not.toContain('w-[165px] h-[80px]');
  });

  it('renders the five navigation items followed by the CTA in declared order', async () => {
    const html = await render();
    const nav = getDesktopNav(html);

    const hrefs = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1] ?? '');
    // Five nav items + CTA as the last item inside the nav
    expect(hrefs).toEqual(['/', '/productos', '/servicios', '/marcas', '/contacto', '/cotizacion']);

    const labels = [...nav.matchAll(/>([^<>]+)<\/a>/g)].map((m) => (m[1] ?? '').trim());
    expect(labels).toEqual([
      'Inicio',
      'Productos',
      'Servicios',
      'Marcas',
      'Contacto',
      'SOLICITAR COTIZACIÓN',
    ]);
  });

  it('renders the CTA as the last item inside the nav with accent styling unchanged', async () => {
    const html = await render();
    const nav = getDesktopNav(html);

    // CTA is inside the nav (as the last <a>)
    expect(nav).toContain('href="/cotizacion"');
    expect(nav).toContain('SOLICITAR COTIZACIÓN');
    // CTA retains its accent styling
    expect(nav).toContain('bg-accent');
    expect(nav).not.toContain('bg-brand-orange');
    expect(nav).toContain('font-heading');
    expect(nav).toContain('font-semibold');
    expect(nav).not.toContain('font-bold');
    expect(nav).toContain('uppercase');
    // The CTA no longer uses the old standalone visibility utility
    // (it lives inside the nav whose own responsive classes handle visibility)
    const ctaMatch = [...nav.matchAll(/href="\/cotizacion"/g)];
    expect(ctaMatch.length).toBe(1);
    // CTA is the last link in the nav
    const navLinks = [...nav.matchAll(/href="([^"]+)"/g)].map((m) => m[1] ?? '');
    expect(navLinks[navLinks.length - 1]).toBe('/cotizacion');
  });

  it('right-aligns the desktop nav', async () => {
    const html = await render();
    const nav = getDesktopNav(html);
    expect(nav).toContain('ml-auto');
  });

  it('marks the item matching activePath with aria-current and 3px primary underline', async () => {
    const html = await render({ ...baseProps, activePath: '/productos' });
    const nav = getDesktopNav(html);

    const productoItem = nav.match(/<a[^>]*href="\/productos"[^>]*>/)?.[0] ?? '';
    expect(productoItem).toContain('aria-current="page"');
    expect(productoItem).toContain('after:bg-primary');
    // 3px underline (updated from the old 2px h-0.5)
    expect(productoItem).toContain('after:h-[3px]');
    // Obsolete 2px underline should NOT appear on the active item
    expect(productoItem).not.toContain('after:h-0.5');
  });

  it('marks Inicio active only at the root path', async () => {
    const atRoot = await render({ ...baseProps, activePath: '/' });
    const inicioAtRoot = getDesktopNav(atRoot).match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';
    expect(inicioAtRoot).toContain('aria-current="page"');

    const atSection = await render({ ...baseProps, activePath: '/productos' });
    const inicioAtSection = getDesktopNav(atSection).match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';
    expect(inicioAtSection).not.toContain('aria-current="page"');
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

  it('hides the desktop nav on mobile and exposes a fixed hamburger toggle with high z-index', async () => {
    const html = await render();

    expect(getDesktopNav(html)).toContain('hidden lg:flex');
    // The mobile toggle is fixed (always visible above overlay) with z-50
    const toggleMatch = html.match(/<button[^>]*data-menu-toggle[^>]*>/);
    expect(toggleMatch, 'mobile toggle button not found').toBeTruthy();
    const toggleAttrs = toggleMatch?.[0] ?? '';
    expect(toggleAttrs).toContain('lg:hidden');
    expect(toggleAttrs).toContain('fixed');
    expect(toggleAttrs).toContain('z-50');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="mobile-nav"');
    expect(html).toContain('aria-label="Abrir menú"');
  });

  it('renders the header with data-menu-open state attribute for CSS-driven overlay', async () => {
    const html = await render();

    // The <header> carries data-menu-open="false" (CSS-driven menu state)
    expect(html).toContain('data-menu-open="false"');

    // The inline <style> contains the transform + pointer-events rules
    expect(html).toMatch(/header\[data-menu-open="false"\]/);
    expect(html).toMatch(/header\[data-menu-open="true"\]/);
  });

  it('renders the mobile overlay as a fullscreen white canvas (no hidden HTML attribute)', async () => {
    const html = await render();
    const overlay = getMobileNav(html);

    expect(overlay).toContain('id="mobile-nav"');
    expect(overlay).toContain('fixed');
    expect(overlay).toContain('inset-0');
    expect(overlay).toContain('bg-white');
    expect(overlay).toContain('z-40');
    // The old `hidden` HTML attribute is removed; visibility is CSS-driven via
    // data-menu-open on <header>. (lg:hidden is a Tailwind responsive utility,
    // not the hidden attribute -- it hides the overlay on desktop.)
    expect(overlay).not.toMatch(/<div id="mobile-nav" hidden\b/);
  });

  it('renders the fullscreen overlay with all items + CTA as last item', async () => {
    const html = await render();
    const overlay = getMobileNav(html);

    const labels = [...overlay.matchAll(/>([^<>]+)<\/a>/g)].map((m) => (m[1] ?? '').trim());
    expect(labels).toEqual([
      'Inicio',
      'Productos',
      'Servicios',
      'Marcas',
      'Contacto',
      'SOLICITAR COTIZACIÓN',
    ]);
  });

  it('applies the slide-in CSS transform based on data-menu-open', async () => {
    const html = await render();

    // The inline CSS transforms the overlay off-screen right (translateX(100%))
    // when closed and visible (translateX(0)) when open
    expect(html).toContain('translateX(100%)');
    expect(html).toContain('translateX(0)');
    // The overlay has transition-transform for a smooth 300ms ease-in-out animation
    const overlay = getMobileNav(html);
    expect(overlay).toContain('transition-transform');
    expect(overlay).toContain('duration-300');
    expect(overlay).toContain('ease-in-out');
  });

  it('marks the active item with 3px underline in the mobile nav overlay', async () => {
    const html = await render({ ...baseProps, activePath: '/servicios' });
    const overlay = getMobileNav(html);

    const serviciosItem = overlay.match(/<a[^>]*href="\/servicios"[^>]*>/)?.[0] ?? '';
    expect(serviciosItem).toContain('aria-current="page"');
    expect(serviciosItem).toContain('after:h-[3px]');
    expect(serviciosItem).toContain('after:bg-primary');
  });

  it('adapts the toggle button color for the overlay background', async () => {
    const html = await render();

    // CSS rules: white icon on navy header (closed), secondary on white overlay (open)
    expect(html).toContain('var(--color-white)');
    expect(html).toContain('var(--color-secondary)');
    expect(html).toContain('var(--color-white)'); // background-color for open state
  });

  it('meets accessibility requirements', async () => {
    const html = await render();
    // Strip HTML comments, scripts and styles so `<header>` in comment/text
    // inside <style>/<script> blocks does not produce false-positive matches.
    const cleanHtml = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/<style[\s\S]*?<\/style>/g, '');

    expect(cleanHtml.match(/<header[\s>]/g)).toHaveLength(1);
    expect(html).toContain('<nav aria-label="Navegación principal"');
    expect(html).toContain('aria-label="Ir al inicio"');
    expect(html).toContain('aria-label="Abrir menú"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="mobile-nav"');

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

      expect(html).toContain('from-secondary');
      expect(html).toContain('to-secondary-light');
    });
  });
});
