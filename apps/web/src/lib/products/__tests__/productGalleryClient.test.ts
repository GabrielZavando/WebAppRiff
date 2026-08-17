import { describe, it, expect } from 'vitest';
import { computeGalleryState } from '@/lib/products/productGalleryClient';

describe('productGalleryClient (pure helpers)', () => {
  const MAIN_SELECTOR = '[data-gallery-main] img[data-main-image]';
  const THUMB_SELECTOR = '[data-gallery-thumbs] [data-gallery-index]';

  it('resolves the selected image url for a given index', () => {
    const urls = ['a.webp', 'b.webp', 'c.webp'];
    const state = computeGalleryState(urls, 2);
    expect(state.selectedIndex).toBe(2);
    expect(state.selectedUrl).toBe('c.webp');
    expect(state.mainImageSelector).toBe(MAIN_SELECTOR);
    expect(state.thumbSelector).toBe(THUMB_SELECTOR);
  });

  it('clamps an out-of-range index to the bounds', () => {
    const urls = ['a.webp', 'b.webp'];
    expect(computeGalleryState(urls, -5).selectedIndex).toBe(0);
    expect(computeGalleryState(urls, 99).selectedIndex).toBe(1);
  });

  it('handles an empty gallery gracefully', () => {
    const state = computeGalleryState([], 0);
    expect(state.selectedIndex).toBe(0);
    expect(state.selectedUrl).toBe('');
  });

  it('exposes the canonical selectors so the DOM glue and tests agree', () => {
    expect(MAIN_SELECTOR).toContain('data-main-image');
    expect(THUMB_SELECTOR).toContain('data-gallery-index');
  });
});
