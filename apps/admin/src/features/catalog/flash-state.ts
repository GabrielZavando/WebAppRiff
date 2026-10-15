/**
 * Inline success banners via Router navigation state (task 7.2, design D5).
 * The saving page navigates with `{ state: { flash: 'created' | 'updated' |
 * 'deleted' } }`; the destination list consumes it once and clears it, so a
 * browser reload never re-shows the banner (query params were discarded for
 * exactly that reason — see design D5).
 */

export type FlashKind = 'created' | 'updated' | 'deleted';

const VALID_KINDS: readonly FlashKind[] = ['created', 'updated', 'deleted'];

/**
 * Reads the flash kind from the current history state and removes it from the
 * state object. Returns null when absent or not a known kind (unknown values
 * are left untouched).
 */
export function consumeNavigationFlash(): FlashKind | null {
  const state = history.state as { flash?: unknown } | null;
  const flash = state?.flash;
  if (typeof flash !== 'string' || !VALID_KINDS.includes(flash as FlashKind)) {
    return null;
  }
  if (state !== null && state.flash !== undefined) {
    const rest: Record<string, unknown> = { ...state };
    delete rest['flash'];
    history.replaceState(rest, '');
  }
  return flash as FlashKind;
}

/** Spanish banner copy for a flash kind, capitalized per entity. */
export function flashMessage(kind: FlashKind, entity: string): string {
  const verbs: Record<FlashKind, string> = {
    created: 'creado',
    updated: 'actualizado',
    deleted: 'eliminado',
  };
  const feminine = entity === 'categoría' || entity === 'subcategoría';
  const participle = feminine ? verbs[kind].replace(/o$/, 'a') : verbs[kind];
  const capitalized = entity.charAt(0).toUpperCase() + entity.slice(1);
  return `${capitalized} ${participle} con éxito.`;
}
