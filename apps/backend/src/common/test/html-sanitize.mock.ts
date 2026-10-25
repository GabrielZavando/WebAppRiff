// Mocks the external @riff/html-sanitize package so backend unit/integration
// tests don't load its ESM-only transitive deps (sanitize-html -> htmlparser2)
// under Jest's CommonJS runtime. The real sanitization policy is covered by the
// package's own Vitest suite; backend tests only need the delegation contract.
jest.mock('@riff/html-sanitize', () => {
  const he = jest.requireActual<typeof import('he')>('he');

  const toVisibleText = (dirty: string): string =>
    he
      .decode(
        dirty
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/(p|div|h[1-6]|li|blockquote|ul|ol|tr)>/gi, '\n')
          .replace(/<[^>]*>/g, ''),
      )
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .trim();

  return {
    sanitizeRichHtml: jest.fn((dirty: string) => dirty),
    stripHtmlToText: jest.fn((dirty: string) => dirty),
    visibleTextLength: jest.fn((dirty: string) =>
      dirty ? toVisibleText(dirty).length : 0,
    ),
    ALLOWED_TAGS: [],
    RICH_HTML_CONFIG: {},
  };
});
