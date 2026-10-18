import sharp from 'sharp';

import { normalizeUploadedImage, validateImageContent } from './image-content';

async function jpegBuffer(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: 'red' } })
    .jpeg()
    .toBuffer();
}

async function pngBuffer(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: 'blue' } })
    .png()
    .toBuffer();
}

async function webpBuffer(): Promise<Buffer> {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: 'green' } })
    .webp()
    .toBuffer();
}

describe('validateImageContent', () => {
  it('accepts a real JPEG and reports sniffed format jpeg', async () => {
    const result = await validateImageContent(await jpegBuffer());
    expect(result.ok).toBe(true);
    expect(result.ok && result.format).toBe('jpeg');
  });

  it('accepts a real PNG and reports sniffed format png', async () => {
    const result = await validateImageContent(await pngBuffer());
    expect(result.ok).toBe(true);
    expect(result.ok && result.format).toBe('png');
  });

  it('accepts a real WEBP and reports sniffed format webp', async () => {
    const result = await validateImageContent(await webpBuffer());
    expect(result.ok).toBe(true);
    expect(result.ok && result.format).toBe('webp');
  });

  it('rejects a buffer sharp cannot parse (MIME declared but fake content)', async () => {
    const fake = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.from('definitely-not png bytes'),
    ]);
    const result = await validateImageContent(fake);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-image');
    }
  });

  it('rejects empty buffers', async () => {
    const result = await validateImageContent(Buffer.alloc(0));
    expect(result.ok).toBe(false);
  });

  it('rejects parseable but catalog-disallowed formats (e.g. GIF)', async () => {
    // 1x1 transparent GIF: sharp parses it (metadata.format === 'gif'), but the
    // catalog allowlist only accepts jpeg/png/webp.
    const gif = Buffer.from('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAUwAOw==', 'base64');
    const result = await validateImageContent(gif);
    if (result.ok) {
      // Fail loudly with a reason instead of an opaque assertion error.
      throw new Error(`expected GIF to be rejected, got format=${result.format}`);
    }
    expect(result.reason).toBe('invalid-image');
  });
});

describe('normalizeUploadedImage', () => {
  it('converts jpeg to webp and keeps webp untouched', async () => {
    const jpeg = await jpegBuffer();
    const normalizedJpeg = await normalizeUploadedImage(jpeg, 'jpeg');
    const jpegMeta = await sharp(normalizedJpeg).metadata();
    expect(jpegMeta.format).toBe('webp');

    const webp = await webpBuffer();
    const normalizedWebp = await normalizeUploadedImage(webp, 'webp');
    expect(normalizedWebp.equals(webp)).toBe(true);
  });

  it('converts png to webp', async () => {
    const png = await pngBuffer();
    const normalizedPng = await normalizeUploadedImage(png, 'png');
    const pngMeta = await sharp(normalizedPng).metadata();
    expect(pngMeta.format).toBe('webp');
  });
});
