import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const MAX_DESCRIPCION_BREVE = 800;
export const MAX_DESCRIPCION_LARGA = 3000;

const NON_TEXT_BLOCK = /<(script|style|textarea|option|noscript|title)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const BLOCK_BOUNDARY = /<\/(p|div|h[1-6]|li|blockquote|ul|ol|tr)>/gi;

function normalizeEscapes(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

function decodeEntities(value: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}

/**
 * Number of visible characters in `html`. Markup, attributes, entities and
 * non-text content (script/style) do not count, matching the backend helper.
 */
export function visibleTextLength(html: string): number {
  if (!html) return 0;

  const withBoundaries = normalizeEscapes(decodeEntities(html))
    .replace(NON_TEXT_BLOCK, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(BLOCK_BOUNDARY, '\n');

  const container = document.createElement('div');
  container.innerHTML = withBoundaries;

  return (container.textContent ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim().length;
}

/**
 * Reactive Forms validator that rejects values whose visible text exceeds
 * `max`. Empty and non-string values are left to other validators.
 */
export function maxVisibleTextLength(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (typeof value !== 'string' || value.length === 0) return null;

    const actual = visibleTextLength(value);
    return actual > max
      ? { maxVisibleTextLength: { max, actual } }
      : null;
  };
}
