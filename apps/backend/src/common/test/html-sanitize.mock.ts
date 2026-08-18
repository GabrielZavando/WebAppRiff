// Mocks the external @riff/html-sanitize package so backend unit/integration
// tests don't load its ESM-only transitive deps (sanitize-html -> htmlparser2)
// under Jest's CommonJS runtime. The real sanitization policy is covered by the
// package's own Vitest suite; backend tests only need the delegation contract.
jest.mock('@riff/html-sanitize', () => ({
  sanitizeRichHtml: jest.fn((dirty: string) => dirty),
  stripHtmlToText: jest.fn((dirty: string) => dirty),
  ALLOWED_TAGS: [],
  RICH_HTML_CONFIG: {},
}));
