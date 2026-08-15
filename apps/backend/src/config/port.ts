/**
 * Resolves the HTTP listen port from the raw `PORT` environment variable.
 *
 * Rules:
 * - `undefined` (unset)  → 3000 (default)
 * - empty / whitespace   → 3000 (invalid input falls back to default)
 * - non-numeric / negative → 3000
 * - `0`                  → 0 (explicit ephemeral port is respected, so tests and
 *                           container runtimes can request an OS-assigned port)
 */
export function resolvePort(raw: string | undefined): number {
  const DEFAULT_PORT = 3000;

  if (raw === undefined) {
    return DEFAULT_PORT;
  }

  const trimmed = raw.trim();
  if (trimmed === '') {
    return DEFAULT_PORT;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return DEFAULT_PORT;
  }

  return parsed;
}
