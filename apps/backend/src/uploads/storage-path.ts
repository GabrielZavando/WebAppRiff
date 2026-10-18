import { randomUUID } from 'crypto';

/**
 * Storage path strategy for the HTTP uploads domain (design D5, amended):
 * ALWAYS `productos/tmp-<uuid>/<name>` — creation and edit alike. Everything
 * lives under the single `productos/tmp-` prefix so the bucket lifecycle rule
 * (`age > 48h` over that literal prefix) can clean orphans without backend
 * code: GCS lifecycle `matchesPrefix` has no wildcard support, so a
 * per-producto path could never be matched by a generic rule, and a bare
 * `productos/` age rule would eventually delete migrated final assets.
 *
 * File names are reduced to a single sanitized segment; the caller always
 * passes an allowlisted extension derived from validated content.
 */
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

/** Lowercases, de-accents and reduces the stem to a safe [a-z0-9-] slug. */
function sanitizeStem(rawStem: string): string {
  const slug = rawStem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'file' : slug.slice(0, 80);
}

/** Allowlisted [a-z0-9]{1,16} extension or empty string. */
function allowlistedExtension(options: string, fallbackCandidates: string[]): string {
  const candidates: string[] = [options, ...fallbackCandidates];
  for (const candidate of candidates) {
    if (/^[a-z0-9]{1,16}$/.test(candidate)) {
      return candidate;
    }
  }
  return '';
}

/**
 * Single-segment, path-safe file name. Strips any path separators (including
 * backslashes), de-accents and lowercases the stem to [a-z0-9-]; the final
 * extension is the caller-validated one when provided, else the file's own
 * simple extension if it is [a-z0-9]{1,16}. Uniqueness comes from the
 * `tmp-<uuid>` directory, not from the file name.
 */
export function sanitizeFileName(
  originalName: string,
  options: { extension?: string } = {},
): string {
  const base = originalName.replace(/\\/g, '/').split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const localExt = dot > 0 ? base.slice(dot + 1).toLowerCase() : '';

  const extension = allowlistedExtension(options.extension ?? '', [localExt]);
  return `${sanitizeStem(stem)}.${extension}`.replace(/\.$/, '');
}

export interface BuildUploadPathInput {
  originalName: string;
  contentType: string;
  /** Final extension AFTER normalization (e.g. always webp for images). */
  normalizedExtension?: string;
}

export function buildProductUploadPath(input: BuildUploadPathInput): string {
  const uuid = randomUUID();
  const extension =
    input.normalizedExtension ?? EXTENSION_BY_CONTENT_TYPE[input.contentType] ?? '';

  // Single tmp-<uuid> directory: uniqueness per upload is the only defense
  // needed; the lifecycle rule cleans the whole `productos/tmp-` tree.
  const name = sanitizeFileName(input.originalName, {
    extension: extension === '' ? undefined : extension,
  });

  return `productos/tmp-${uuid}/${name}`;
}
