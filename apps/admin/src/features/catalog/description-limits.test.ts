import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  MAX_DESCRIPCION_BREVE,
  MAX_DESCRIPCION_LARGA,
  maxVisibleTextLength,
  visibleTextLength,
} from './description-limits';

describe('visibleTextLength', () => {
  it('counts plain text characters', () => {
    expect(visibleTextLength('Hola mundo')).toBe(10);
  });

  it('does not count HTML markup', () => {
    expect(visibleTextLength('<p><strong>Hola</strong></p>')).toBe(4);
  });

  it('decodes HTML entities', () => {
    expect(visibleTextLength('Tom &amp; Jerry')).toBe(11);
    expect(visibleTextLength('&lt;p&gt;Hola&lt;/p&gt;')).toBe(4);
  });

  it('ignores script and style content', () => {
    expect(
      visibleTextLength('<p>Texto</p><script>alert(1)</script><style>.x{color:red}</style>'),
    ).toBe(5);
  });

  it('normalizes literal newline escapes', () => {
    expect(visibleTextLength('Linea1\\nLinea2')).toBe(13);
  });

  it('returns 0 for empty input', () => {
    expect(visibleTextLength('')).toBe(0);
  });
});

describe('maxVisibleTextLength', () => {
  it('accepts exactly the maximum number of visible characters', () => {
    const control = new FormControl(`<p>${'a'.repeat(MAX_DESCRIPCION_LARGA)}</p>`);
    expect(maxVisibleTextLength(MAX_DESCRIPCION_LARGA)(control)).toBeNull();
  });

  it('rejects one visible character over the maximum', () => {
    const control = new FormControl(`<p>${'a'.repeat(MAX_DESCRIPCION_LARGA + 1)}</p>`);
    expect(maxVisibleTextLength(MAX_DESCRIPCION_LARGA)(control)).toEqual({
      maxVisibleTextLength: { max: MAX_DESCRIPCION_LARGA, actual: MAX_DESCRIPCION_LARGA + 1 },
    });
  });

  it('applies the short-description limit independently', () => {
    const atLimit = new FormControl('a'.repeat(MAX_DESCRIPCION_BREVE));
    const overLimit = new FormControl('a'.repeat(MAX_DESCRIPCION_BREVE + 1));
    expect(maxVisibleTextLength(MAX_DESCRIPCION_BREVE)(atLimit)).toBeNull();
    expect(maxVisibleTextLength(MAX_DESCRIPCION_BREVE)(overLimit)).not.toBeNull();
  });

  it('does not flag empty or non-string values', () => {
    expect(maxVisibleTextLength(MAX_DESCRIPCION_LARGA)(new FormControl(''))).toBeNull();
    expect(maxVisibleTextLength(MAX_DESCRIPCION_LARGA)(new FormControl(null))).toBeNull();
  });
});
