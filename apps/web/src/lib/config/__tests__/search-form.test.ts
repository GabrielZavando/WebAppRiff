import { describe, it, expect, afterEach } from 'vitest';
import { getSearchFormConfig, buildSearchHref } from '@/lib/config/search-form';

const ENV_KEYS = [
  'SEARCH_RESULTS_PATH',
  'SEARCH_SUBMIT_LABEL',
  'SEARCH_PLACEHOLDER',
] as const;

function clearEnv(): void {
  for (const key of ENV_KEYS) {
    delete import.meta.env[key];
  }
}

afterEach(() => {
  clearEnv();
});

describe('getSearchFormConfig', () => {
  it('returns defaults when env vars are missing', () => {
    clearEnv();
    const config = getSearchFormConfig();
    expect(config).toEqual({
      action: '/productos',
      submitLabel: 'BUSCAR',
      inputPlaceholder: '¿Qué productos estás buscando?',
      inputName: 'q',
      selectName: 'categoriaId',
    });
  });

  it('honours SEARCH_RESULTS_PATH override', () => {
    clearEnv();
    import.meta.env.SEARCH_RESULTS_PATH = '/catalogo';
    const config = getSearchFormConfig();
    expect(config.action).toBe('/catalogo');
    // Other defaults are kept intact
    expect(config.submitLabel).toBe('BUSCAR');
    expect(config.inputPlaceholder).toBe('¿Qué productos estás buscando?');
    expect(config.inputName).toBe('q');
    expect(config.selectName).toBe('categoriaId');
  });

  it('honours SEARCH_SUBMIT_LABEL override', () => {
    clearEnv();
    import.meta.env.SEARCH_SUBMIT_LABEL = 'IR';
    const config = getSearchFormConfig();
    expect(config.submitLabel).toBe('IR');
    expect(config.action).toBe('/productos');
  });

  it('honours SEARCH_PLACEHOLDER override', () => {
    clearEnv();
    import.meta.env.SEARCH_PLACEHOLDER = 'Encuentra tu producto';
    const config = getSearchFormConfig();
    expect(config.inputPlaceholder).toBe('Encuentra tu producto');
    expect(config.action).toBe('/productos');
  });

  it('honours all overrides together', () => {
    clearEnv();
    import.meta.env.SEARCH_RESULTS_PATH = '/catalogo';
    import.meta.env.SEARCH_SUBMIT_LABEL = 'IR';
    import.meta.env.SEARCH_PLACEHOLDER = 'Encuentra tu producto';
    const config = getSearchFormConfig();
    expect(config).toEqual({
      action: '/catalogo',
      submitLabel: 'IR',
      inputPlaceholder: 'Encuentra tu producto',
      inputName: 'q',
      selectName: 'categoriaId',
    });
  });
});

describe('buildSearchHref', () => {
  it('builds full URL when both query and categoriaId are provided', () => {
    expect(buildSearchHref('taladro', 'herramientas', '/productos')).toBe(
      '/productos?q=taladro&categoriaId=herramientas',
    );
  });

  it('omits empty categoriaId', () => {
    expect(buildSearchHref('taladro', '', '/productos')).toBe(
      '/productos?q=taladro',
    );
  });

  it('omits empty query', () => {
    expect(buildSearchHref('', 'herramientas', '/productos')).toBe(
      '/productos?categoriaId=herramientas',
    );
  });

  it('omits both empty values (no query string)', () => {
    expect(buildSearchHref('', '', '/productos')).toBe('/productos');
  });

  it('omits whitespace-only query', () => {
    expect(buildSearchHref('   ', 'herramientas', '/productos')).toBe(
      '/productos?categoriaId=herramientas',
    );
  });

  it('trims whitespace at the start and end of the query value', () => {
    expect(buildSearchHref('   taladro   ', '', '/productos')).toBe(
      '/productos?q=taladro',
    );
  });

  it('URL-encodes special characters in the query', () => {
    expect(buildSearchHref('taladro & sierra', 'herramientas', '/productos')).toBe(
      '/productos?q=taladro+%26+sierra&categoriaId=herramientas',
    );
  });

  it('honours a custom action path', () => {
    expect(buildSearchHref('foo', 'bar', '/catalogo')).toBe(
      '/catalogo?q=foo&categoriaId=bar',
    );
  });

  it('preserves internal whitespace in the query (only trims edges)', () => {
    expect(buildSearchHref('  taladro industrial  ', '', '/productos')).toBe(
      '/productos?q=taladro+industrial',
    );
  });

  it('encodes characters needing percent-encoding in categoriaId', () => {
    // categoriaId in practice is a stable kebab-case slug, but buildSearchHref
    // still encodes any value it receives so callers cannot bypass encoding.
    expect(buildSearchHref('foo', 'a b', '/productos')).toBe(
      '/productos?q=foo&categoriaId=a+b',
    );
  });
});
