import sharp from 'sharp';

export interface ImageContentOk {
  ok: true;
  format: 'jpeg' | 'png' | 'webp';
}

export interface ImageContentError {
  ok: false;
  reason: 'invalid-image';
}

export type ImageContentResult = ImageContentOk | ImageContentError;

/**
 * Real-content check for image uploads: parses the bytes with sharp instead of
 * trusting the client-declared MIME type. Only catalog-allowed formats pass:
 * jpeg, png and webp.
 */
export async function validateImageContent(buffer: Buffer): Promise<ImageContentResult> {
  if (buffer.length === 0) {
    return { ok: false, reason: 'invalid-image' };
  }

  let format: import('sharp').Metadata['format'];
  try {
    const metadata = await sharp(buffer).metadata();
    format = metadata.format;
  } catch {
    return { ok: false, reason: 'invalid-image' };
  }

  if (format !== 'jpeg' && format !== 'png' && format !== 'webp') {
    return { ok: false, reason: 'invalid-image' };
  }

  return { ok: true, format };
}

/**
 * Normalizes a validated image to webp (jpeg/png are converted; webp passes
 * through unchanged). Purpose: keep catalog assets webp-only and consistent
 * with `migrate:productos:imagenes`.
 */
export async function normalizeUploadedImage(buffer: Buffer, format: 'jpeg' | 'png' | 'webp'): Promise<Buffer> {
  if (format === 'webp') {
    return buffer;
  }
  return sharp(buffer).webp().toBuffer();
}
