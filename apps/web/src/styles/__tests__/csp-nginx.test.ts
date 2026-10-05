import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * SC-006 — CSP font-src allows embedded @fontsource fonts (ui-chrome-uniform,
 * task 5.1 RED).
 *
 * Both `apps/web/nginx.conf` and `apps/admin/nginx.conf` repeat the full
 * security header set in every `location` that emits `add_header` (nginx
 * `add_header` inheritance shadows enclosing levels). Every
 * `Content-Security-Policy` occurrence MUST allow the self-hosted
 * `@fontsource` fonts that the build inlines as base64 `data:` URIs, i.e.
 * `font-src 'self' https: data:` — all other CSP directives stay unchanged.
 *
 * Source of truth:
 * - openspec/changes/ui-chrome-uniform/specs/add-frontend-smoke-and-nginx-hardening/spec.md
 *   (Requirement: Nginx SHALL enforce cache policy and security headers;
 *   Scenario: CSP font-src allows embedded fonts)
 */

/** Captures every CSP directive string emitted via `add_header` in an nginx.conf. */
const CSP_ADD_HEADER_SOURCE = 'add_header\\s+Content-Security-Policy\\s+"([^"]+)"';

/** Directives that MUST remain unchanged in every CSP (SC-006 contract). */
const UNCHANGED_DIRECTIVES: readonly string[] = [
  "default-src 'self'",
  'script-src',
  'style-src',
  "img-src 'self' data: https:",
  'connect-src',
  "object-src 'none'",
];

/** The font-src directive the whole contract revolves around. */
const FONT_SRC_WITH_DATA = "font-src 'self' https: data:";

/** Expected CSP `add_header` occurrences per nginx.conf (one per location). */
const EXPECTED_CSP_COUNT = 3;

function readNginxConf(relativeToThisFile: string): string {
  const path = fileURLToPath(new URL(relativeToThisFile, import.meta.url));
  if (!existsSync(path)) {
    throw new Error(
      `nginx.conf not found at ${path} — adjust relative URL "${relativeToThisFile}"`,
    );
  }
  return readFileSync(path, 'utf-8');
}

function extractCspValues(conf: string): string[] {
  const regex = new RegExp(CSP_ADD_HEADER_SOURCE, 'g');
  return [...conf.matchAll(regex)].map((match) => match[1]!);
}

describe('SC-006 — CSP font-src allows embedded @fontsource fonts (task 5.1)', () => {
  const CONF_FILES: ReadonlyArray<{ label: string; relativeToThisFile: string }> = [
    { label: 'apps/web/nginx.conf', relativeToThisFile: '../../../nginx.conf' },
    {
      label: 'apps/admin/nginx.conf',
      relativeToThisFile: '../../../../../apps/admin/nginx.conf',
    },
  ];

  for (const { label, relativeToThisFile } of CONF_FILES) {
    describe(label, () => {
      const cspValues = extractCspValues(readNginxConf(relativeToThisFile));

      it('emits exactly 3 Content-Security-Policy add_header occurrences (one per location)', () => {
        expect(cspValues).toHaveLength(EXPECTED_CSP_COUNT);
      });

      it("every CSP includes font-src 'self' https: data: (RED until task 5.2)", () => {
        const withoutData = cspValues.filter((csp) => !csp.includes(FONT_SRC_WITH_DATA));
        expect(
          withoutData,
          `${withoutData.length} CSP occurrence(s) in ${label} lack the data: font-src source`,
        ).toEqual([]);
      });

      it('keeps the remaining CSP directives unchanged', () => {
        for (const csp of cspValues) {
          for (const directive of UNCHANGED_DIRECTIVES) {
            expect(csp, `every CSP in ${label} must keep ${directive}`).toContain(directive);
          }
        }
      });
    });
  }
});