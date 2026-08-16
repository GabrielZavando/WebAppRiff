/**
 * Derives a URL-friendly slug from an arbitrary string. Used when the caller does
 * not provide an explicit slug on create (products, categories, subcategories).
 * Deterministic and ASCII-safe: lowercases, strips combining diacritical marks,
 * and replaces any run of non-alphanumeric characters with a single hyphen.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
