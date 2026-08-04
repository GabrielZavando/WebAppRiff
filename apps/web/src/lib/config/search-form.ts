import type { CategoryOption, SearchFormConfig } from '@/lib/types/search-form';

/**
 * Hardcoded category options for the search form `<select>`.
 *
 * The first option is the implicit "no filter" choice: it has an empty `id`
 * so the canonical search URL omits `categoriaId` when it is selected. The
 * rest are stable placeholder categories of the Riff domain. They will be
 * replaced with the real list coming from Firestore when the change
 * `product-catalog` consumes the API at runtime. Keeping them hardcoded for
 * now is consistent with `NAVIGATION_ITEMS` in `navigation.ts`: any change
 * requires a rebuild anyway because the site is SSG.
 */
export const CATEGORY_OPTIONS: readonly CategoryOption[] = [
  { id: '', label: 'Todas las categorías' },
  { id: 'herramientas', label: 'Herramientas' },
  { id: 'seguridad', label: 'Seguridad' },
  { id: 'electricidad', label: 'Electricidad' },
];

/** Default values for the search form configuration. */
export const SEARCH_FORM_DEFAULTS: Readonly<SearchFormConfig> = {
  action: '/productos',
  submitLabel: 'BUSCAR',
  inputPlaceholder: '¿Qué solución está buscando?',
  inputName: 'q',
  selectName: 'categoriaId',
};

/** Environment variable names consumed by `getSearchFormConfig`. */
const ENV = {
  resultsPath: 'SEARCH_RESULTS_PATH',
  submitLabel: 'SEARCH_SUBMIT_LABEL',
  placeholder: 'SEARCH_PLACEHOLDER',
} as const;

/**
 * Builds the search form configuration from environment variables with
 * sensible defaults. Falls back to `SEARCH_FORM_DEFAULTS` so the component
 * renders even when env vars are missing (e.g. local dev without .env).
 */
export function getSearchFormConfig(): SearchFormConfig {
  return {
    action: import.meta.env[ENV.resultsPath] || SEARCH_FORM_DEFAULTS.action,
    submitLabel:
      import.meta.env[ENV.submitLabel] || SEARCH_FORM_DEFAULTS.submitLabel,
    inputPlaceholder:
      import.meta.env[ENV.placeholder] || SEARCH_FORM_DEFAULTS.inputPlaceholder,
    inputName: SEARCH_FORM_DEFAULTS.inputName,
    selectName: SEARCH_FORM_DEFAULTS.selectName,
  };
}

/**
 * Builds the canonical search URL from a query and a category id.
 *
 * Rules:
 * - `query` is trimmed of leading/trailing whitespace before being encoded.
 * - When the trimmed `query` is empty, the `q` parameter is omitted so the URL
 *   never carries `?q=`.
 * - When `categoriaId` is empty, the `categoriaId` parameter is omitted.
 * - When both are empty, no query string is appended.
 * - Values are URL-encoded via `encodeURIComponent` (spaces become `+` via
 *   `application/x-www-form-urlencoded`-style encoding, matching what an HTML
 *   `<form method="get">` would produce natively).
 *
 * Pure helper (no IO): testable without mounting any component.
 */
export function buildSearchHref(
  query: string,
  categoriaId: string,
  action: string,
): string {
  const trimmedQuery = query.trim();
  const params = new URLSearchParams();

  if (trimmedQuery !== '') {
    params.set('q', trimmedQuery);
  }
  if (categoriaId !== '') {
    params.set('categoriaId', categoriaId);
  }

  const queryString = params.toString();
  return queryString === '' ? action : `${action}?${queryString}`;
}
