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

function getDesktopNav(html: string): string {
  const match = html.match(/<nav aria-label="Navegación principal"[\s\S]*?<\/nav>/);
  if (!match) throw new Error('Desktop nav not found in rendered HTML');
  return match[0];
}

describe('Header', () => {
  it('renders the logo as a home link with accessible placeholder', async () => {
    const html = await render();

    expect(html).toContain('<a href="/"');
    expect(html).toContain('aria-label="Ir al inicio"');
    expect(html).toContain('w-[165px] h-[80px]');
    expect(html).toContain('Logo placeholder');
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
    expect(nosotroItem).toContain('after:bg-brand-orange');
  });

  it('marks Inicio active only at the root path', async () => {
    const atRoot = await render({ ...baseProps, activePath: '/' });
    const inicioAtRoot = getDesktopNav(atRoot).match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';
    expect(inicioAtRoot).toContain('aria-current="page"');

    const atSection = await render({ ...baseProps, activePath: '/nosotros' });
    const inicioAtSection = getDesktopNav(atSection).match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';
    expect(inicioAtSection).not.toContain('aria-current="page"');
  });

  it('renders the CTA with label, href and orange bold styling', async () => {
    const html = await render();

    expect(html).toContain('SOLICITAR COTIZACIÓN');
    expect(html).toContain('href="/cotizacion"');
    expect(html).toContain('bg-brand-orange');
    expect(html).toContain('font-bold');
    expect(html).toContain('uppercase');
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
});
