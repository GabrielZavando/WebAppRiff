import { describe, it, expect } from 'vitest';
import { buildPaginationItems } from '@/lib/products/buildPaginationItems';

describe('buildPaginationItems', () => {
  it('returns [] when there are no pages', () => {
    expect(buildPaginationItems(1, 0)).toEqual([]);
  });

  it('returns [1] when there is exactly one page', () => {
    expect(buildPaginationItems(1, 1)).toEqual([1]);
  });

  it('returns [1, 2] for two pages (no ellipsis)', () => {
    expect(buildPaginationItems(1, 2)).toEqual([1, 2]);
  });

  it('expands the left cluster on the first page', () => {
    expect(buildPaginationItems(1, 8)).toEqual([1, 2, 3, '…', 8]);
  });

  it('shows a window around a middle page', () => {
    expect(buildPaginationItems(4, 8)).toEqual([1, '…', 3, 4, 5, '…', 8]);
  });

  it('expands the right cluster on the last page', () => {
    expect(buildPaginationItems(8, 8)).toEqual([1, '…', 6, 7, 8]);
  });

  it('handles a small total with current in the middle', () => {
    expect(buildPaginationItems(2, 3)).toEqual([1, 2, 3]);
  });
});
