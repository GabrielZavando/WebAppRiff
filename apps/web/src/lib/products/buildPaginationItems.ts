export type PaginationItem = number | '…';

/**
 * Builds the ordered list of page tokens rendered by `ProductsPagination`.
 *
 * Always includes page `1`, the last page, and a window around the current
 * page. When the current page is near the start (≤ 3) it expands the left
 * cluster to the first three pages; when near the end it expands the right
 * cluster to the last three. `'…'` is inserted between non-adjacent numbers.
 *
 * Pure and deterministic. Examples with `totalPages = 8`:
 * - `page = 1` → `[1, 2, 3, '…', 8]`
 * - `page = 4` → `[1, '…', 3, 4, 5, '…', 8]`
 * - `page = 8` → `[1, '…', 6, 7, 8]`
 */
export function buildPaginationItems(page: number, totalPages: number): readonly PaginationItem[] {
  if (totalPages <= 0) return [];
  if (totalPages === 1) return [1];

  const pages = new Set<number>([1, totalPages, page]);
  pages.add(page - 1);
  pages.add(page + 1);
  if (page <= 3) {
    for (let p = 1; p <= Math.min(totalPages, 3); p++) pages.add(p);
  }
  if (page >= totalPages - 2) {
    for (let p = Math.max(1, totalPages - 2); p <= totalPages; p++) pages.add(p);
  }

  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const result: PaginationItem[] = [];
  let previous: number | null = null;
  for (const current of sorted) {
    if (previous !== null && current - previous > 1) result.push('…');
    result.push(current);
    previous = current;
  }
  return result;
}
