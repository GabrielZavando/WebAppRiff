/**
 * Types shared by the global search form.
 *
 * The search form is a presentational (dumb) component: it receives all its
 * data through props, so these interfaces are the contract between the layout
 * (which owns the configuration) and `SearchForm.astro` (which only renders).
 */

/** A single category option rendered in the `<select>` of the search form. */
export interface CategoryOption {
  /**
   * Stable category identifier used as the `<option value>` and as the
   * `categoriaId` query parameter. The empty string represents the
   * "Todas las categorías" default option, which clears the category filter.
   */
  readonly id: string;
  /** Visible label, e.g. "Herramientas" or "Todas las categorías". */
  readonly label: string;
}

/**
 * Static configuration consumed by `SearchForm.astro`.
 * Built by `getSearchFormConfig()` in `lib/config/search-form.ts` so env vars
 * are read in one place.
 */
export interface SearchFormConfig {
  /** Destination path of the `<form action>` attribute (default: "/productos"). */
  readonly action: string;
  /** Submit button text (default: "BUSCAR"). */
  readonly submitLabel: string;
  /** Search input placeholder (default: "¿Qué solución está buscando?"). */
  readonly inputPlaceholder: string;
  /** `name` attribute of the search `<input>` (default: "q"). */
  readonly inputName: string;
  /** `name` attribute of the category `<select>` (default: "categoriaId"). */
  readonly selectName: string;
}

/** Props accepted by `SearchForm.astro`. */
export interface SearchFormProps {
  /** Category options in render order; the first one is the default. */
  readonly categories: readonly CategoryOption[];
  /** Form configuration (action, submit label, placeholder, field names). */
  readonly config: SearchFormConfig;
  /**
   * Optional initial value for the search input (e.g. read from
   * `Astro.url.searchParams.get('q')`) so the form preserves state across
   * navigations back from `/productos`.
   */
  readonly initialQuery?: string;
  /**
   * Optional initial `value` of the category `<select>` (e.g. read from
   * `Astro.url.searchParams.get('categoriaId')`). When empty or undefined,
   * the default "Todas las categorías" option stays selected.
   */
  readonly initialCategoriaId?: string;
}
