import type { NavItem, CtaConfig } from '@/lib/types/header';

/**
 * Hardcoded main menu. Five fixed items are not worth external config in an
 * SSG: any change requires a rebuild anyway.
 */
export const NAVIGATION_ITEMS: readonly NavItem[] = [
  { label: 'Inicio', href: '/' },
  { label: 'Nosotros', href: '/nosotros' },
  { label: 'Servicios', href: '/servicios' },
  { label: 'Representaciones', href: '/representaciones' },
  { label: 'Contacto', href: '/contacto' },
];

/**
 * Returns true when the item href matches the current path.
 * The root href "/" is special: it is only active on the exact root path so
 * it never matches every section. Non-root hrefs match exactly or as the
 * parent prefix of a nested route ("/nosotros" matches "/nosotros/equipo").
 */
export function isActive(itemHref: string, currentPath: string): boolean {
  if (itemHref === '/') {
    return currentPath === '/';
  }
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
}

/**
 * Quote CTA configuration. Falls back to defaults so the header renders even
 * when the env vars are missing (e.g. local dev without .env).
 */
export function getCtaConfig(): CtaConfig {
  return {
    label: import.meta.env.CTA_LABEL || 'SOLICITAR COTIZACIÓN',
    href: import.meta.env.CTA_HREF || '/cotizacion',
  };
}
