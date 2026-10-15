import { describe, expect, it, beforeEach } from 'vitest';

import { consumeNavigationFlash, flashMessage } from './flash-state';

/**
 * Inline success banners ride on the Router history state (task 7.2, design
 * D5): consumed once per navigation and cleared immediately, so a browser
 * reload (F5) never shows the banner again.
 */
describe('flash-state (design D5)', () => {
  beforeEach(() => {
    history.replaceState({}, '');
  });

  it('reads a valid flash kind from history state and clears it', () => {
    history.replaceState({ flash: 'created', other: 1 }, '');

    expect(consumeNavigationFlash()).toBe('created');
    expect((history.state as { flash?: string }).flash).toBeUndefined();
    expect((history.state as { other?: number }).other).toBe(1);
  });

  it('returns null when there is no flash', () => {
    expect(consumeNavigationFlash()).toBeNull();
  });

  it('returns null and leaves state untouched for unknown flash values', () => {
    history.replaceState({ flash: 'hacked' }, '');

    expect(consumeNavigationFlash()).toBeNull();
    expect((history.state as { flash?: string }).flash).toBe('hacked');
  });

  it('builds the Spanish banner copy per entity', () => {
    expect(flashMessage('created', 'producto')).toBe('Producto creado con éxito.');
    expect(flashMessage('updated', 'categoría')).toBe('Categoría actualizada con éxito.');
    expect(flashMessage('deleted', 'subcategoría')).toBe('Subcategoría eliminada con éxito.');
  });
});
