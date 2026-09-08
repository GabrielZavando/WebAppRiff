import { expect } from 'vitest';

/**
 * Normalizes machine-dependent absolute paths out of string snapshots.
 *
 * Astro's image service renders `/_image?href=%2F%40fs%2F...` URLs that embed
 * the absolute filesystem path of the project (URL-encoded). Without this
 * serializer, HTML snapshots generated on one machine (e.g. a developer's
 * laptop) can never match the values rendered on another (e.g. CI), because
 * the absolute base path differs.
 */
const PROJECT_ROOT = process.cwd();
const PROJECT_ROOT_ENCODED = encodeURIComponent(PROJECT_ROOT);

expect.addSnapshotSerializer({
  test: (value: unknown): boolean =>
    typeof value === 'string' &&
    (value.includes(PROJECT_ROOT) || value.includes(PROJECT_ROOT_ENCODED)),
  print: (value: unknown): string => {
    const normalized = String(value)
      .split(PROJECT_ROOT)
      .join('<PROJECT_ROOT>')
      .split(PROJECT_ROOT_ENCODED)
      .join('<PROJECT_ROOT>');
    return JSON.stringify(normalized);
  },
});
