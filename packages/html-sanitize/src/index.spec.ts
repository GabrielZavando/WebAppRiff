import { describe, expect, it } from 'vitest';
import {
  ALLOWED_TAGS,
  sanitizeRichHtml,
  stripHtmlToText,
  visibleTextLength,
} from './index';

describe('sanitizeRichHtml', () => {
  it('preserves safe formatting tags', () => {
    const input =
      '<p>Ventajas<br><strong>OK</strong></p><ul><li>a</li></ul>';
    const out = sanitizeRichHtml(input);
    expect(out).toContain('<p>');
    expect(out).toContain('<br');
    expect(out).toContain('<strong>');
    expect(out).toContain('<ul>');
    expect(out).toContain('<li>');
  });

  it('strips dangerous content (script, iframe, event handlers)', () => {
    const input =
      '<p>x</p><script>alert(1)</script><iframe src="y"></iframe><a href="z" onclick="evil()">l</a>';
    const out = sanitizeRichHtml(input);
    expect(out).not.toContain('<script>');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('onclick');
    expect(out).toContain('<a href="z">l</a>');
  });

  it('forces rel="noopener noreferrer" on blank-target links', () => {
    const out = sanitizeRichHtml(
      '<a href="https://e.com" target="_blank">ext</a>',
    );
    expect(out).toContain('<a href="https://e.com" target="_blank" rel="noopener noreferrer">');
  });

  it('decodes double-escaped HTML', () => {
    expect(sanitizeRichHtml('&lt;p&gt;Hola&lt;/p&gt;')).toBe('<p>Hola</p>');
  });

  it('strips Divi markup (div->p, no class/style)', () => {
    const out = sanitizeRichHtml(
      '<div class="et_pb_module" style="color:red">Texto</div>',
    );
    expect(out).toContain('<p>');
    expect(out).toContain('Texto');
    expect(out).not.toContain('class=');
    expect(out).not.toContain('style=');
    expect(out).not.toContain('et_pb');
  });

  it('returns empty string for empty/undefined input', () => {
    expect(sanitizeRichHtml('')).toBe('');
    expect(sanitizeRichHtml(null as unknown as string)).toBe('');
  });
});

describe('stripHtmlToText', () => {
  it('removes all tags', () => {
    expect(stripHtmlToText('<p>Hola <strong>mundo</strong><br>fin</p>')).toBe(
      'Hola mundo fin',
    );
  });

  it('decodes entities and collapses whitespace', () => {
    expect(
      stripHtmlToText('  &lt;p&gt;  Texto   con   espacios  &lt;/p&gt;  '),
    ).toBe('Texto con espacios');
  });

  it('normalizes literal \\n / \\r escape sequences (double-encoded newlines)', () => {
    // Source data stores real \r plus literal "\n" (backslash-n); both must be
    // collapsed into clean single-spaced plain text, never rendered as "\n".
    expect(
      stripHtmlToText('Stock permanente.\\r\\n\\r\\nUniversal y muy robusta\\nAmplia gama'),
    ).toBe('Stock permanente. Universal y muy robusta Amplia gama');
  });

  it('returns empty string for empty input', () => {
    expect(stripHtmlToText('')).toBe('');
  });
});

describe('literal newline normalization', () => {
  it('sanitizeRichHtml does not emit literal \\n text', () => {
    expect(sanitizeRichHtml('Linea1\\nLinea2')).not.toContain('\\n');
  });
});

describe('visibleTextLength', () => {
  it('counts plain text characters', () => {
    expect(visibleTextLength('Hola mundo')).toBe(10);
  });

  it('does not count HTML markup', () => {
    expect(visibleTextLength('<p><strong>Hola</strong></p>')).toBe(4);
  });

  it('counts block boundaries as visible separators', () => {
    expect(visibleTextLength('<p>Hola</p><p>mundo</p>')).toBe(10);
  });

  it('decodes entities before counting', () => {
    expect(visibleTextLength('&lt;p&gt;Hola&lt;/p&gt;')).toBe(4);
    expect(visibleTextLength('Tom &amp; Jerry')).toBe(11);
  });

  it('ignores script and style content', () => {
    expect(
      visibleTextLength('<p>Texto</p><script>alert(1)</script><style>.x{color:red}</style>'),
    ).toBe(5);
  });

  it('returns 0 for empty input', () => {
    expect(visibleTextLength('')).toBe(0);
    expect(visibleTextLength(null as unknown as string)).toBe(0);
  });
});

describe('ALLOWED_TAGS policy', () => {
  it('is the agreed safe subset', () => {
    expect([...ALLOWED_TAGS].sort()).toEqual(
      [
        'a',
        'b',
        'blockquote',
        'br',
        'em',
        'h2',
        'h3',
        'h4',
        'i',
        'li',
        'ol',
        'p',
        'strong',
        'u',
        'ul',
      ].sort(),
    );
  });
});
