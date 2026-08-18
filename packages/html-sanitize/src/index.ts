import sanitizeHtml from 'sanitize-html';
import he from 'he';

/**
 * Safe HTML tag subset allowed in product `descripcionLarga`.
 * Deliberately excludes layout/style tags (div, span, table, img, style)
 * and any scripting-capable element. This is the single source of truth for
 * the sanitization policy shared by backend (write path) and frontend (render
 * path). Keep changes in sync with docs/api-spec.yml.
 */
export const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'h2',
  'h3',
  'h4',
] as const;

/**
 * sanitize-html options implementing the Riff rich-text policy:
 * - allow only ALLOWED_TAGS
 * - allow only href/target/rel on <a>; force rel="noopener noreferrer" on links
 * - transform legacy <div> (Divi markup) to <p>
 * - strip all classes/styles/ids and event handlers (not in allowedAttributes)
 * - drop javascript:/data: hrefs by default scheme filter
 */
export const RICH_HTML_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
  },
  allowedClasses: {},
  transformTags: {
    div: 'p',
    a: (_tagName, attribs) => {
      const next = { ...attribs };
      // Force a safe rel whenever the link opts into a new tab.
      if (next.target === '_blank') {
        next.rel = 'noopener noreferrer';
      }
      return { tagName: 'a', attribs: next };
    },
  },
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript', 'title'],
};

/**
 * Decodes HTML entities AND literal backslash escape sequences (`\n`, `\r`,
 * `\t`) that appear in source data. This is required because the seed/legacy
 * data (WordPress/Divi exports) stored newlines as the literal characters
 * `\r\n` instead of real line breaks, which would otherwise render verbatim as
 * the text "\n" in the UI. Returns '' for empty/null input.
 */
function decodeSource(dirty: string): string {
  if (!dirty) return '';
  return he
    .decode(dirty)
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

/**
 * Returns a safe HTML subset of `dirty`. HTML entities and literal `\n`/`\r`/`\t`
 * escapes are decoded first so double-escaped content (e.g. `&lt;p&gt;`) is
 * rendered as real markup and stray "\n" text never reaches the UI.
 * Empty/null input returns an empty string.
 */
export function sanitizeRichHtml(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtml(decodeSource(dirty), RICH_HTML_CONFIG).trim();
}

/**
 * Strips ALL HTML from `dirty` and returns plain text: decodes entities and
 * literal newline escapes, removes tags (replaced by a space so `<br>` between
 * words keeps a word boundary), collapses every whitespace run (real
 * newlines/tabs included) into a single space, and trims. Used for
 * `descripcionBreve` which is modeled as plain text — so double-encoded "\n"
 * artifacts are fully removed from the rendered summary.
 */
export function stripHtmlToText(dirty: string): string {
  if (!dirty) return '';
  return decodeSource(dirty)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
