/**
 * Client-side gallery interaction for the product detail page.
 *
 * The gallery is server-rendered (progressive enhancement): without JavaScript
 * the first image is shown and thumbnails are inert. With JS enabled, clicking a
 * thumbnail swaps the main image. The pure helper `computeGalleryState` is
 * tested in isolation; `initProductGallery` is the DOM glue (not unit-tested).
 */

export const GALLERY_MAIN_SELECTOR = '[data-gallery-main] img[data-main-image]';
export const GALLERY_THUMB_SELECTOR = '[data-gallery-thumbs] [data-gallery-index]';

export interface GalleryState {
  readonly selectedIndex: number;
  readonly selectedUrl: string;
  readonly mainImageSelector: string;
  readonly thumbSelector: string;
}

/**
 * Computes the resolved gallery state for a given selected index. Pure and
 * deterministic — clamps out-of-range indexes and returns an empty url when the
 * gallery is empty.
 */
export function computeGalleryState(
  urls: readonly string[],
  selectedIndex: number,
): GalleryState {
  const count = urls.length;
  const clamped = count === 0 ? 0 : Math.min(Math.max(selectedIndex, 0), count - 1);
  return {
    selectedIndex: clamped,
    selectedUrl: urls[clamped] ?? '',
    mainImageSelector: GALLERY_MAIN_SELECTOR,
    thumbSelector: GALLERY_THUMB_SELECTOR,
  };
}

/**
 * Wires thumbnail click handlers to swap the main image. No-op when the gallery
 * markup is absent (e.g. empty gallery or no-JS fallback already correct).
 */
export function initProductGallery(root: ParentNode = document): void {
  const thumbs = root.querySelectorAll<HTMLButtonElement>(GALLERY_THUMB_SELECTOR);
  if (thumbs.length === 0) {
    return;
  }
  const mainImg = root.querySelector<HTMLImageElement>(GALLERY_MAIN_SELECTOR);
  if (!mainImg) {
    return;
  }

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const img = thumb.querySelector('img');
      if (!img) {
        return;
      }
      mainImg.src = img.src;
      mainImg.alt = img.alt;
      thumbs.forEach((t) => {
        const active = t === thumb;
        t.classList.toggle('border-primary', active);
        t.classList.toggle('border-border', !active);
      });
    });
  });
}
