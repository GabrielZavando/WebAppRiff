import { buildProductUploadPath, sanitizeFileName } from './storage-path';

describe('sanitizeFileName', () => {
  it('keeps the basename and removes traversal/non-ascii-unsafe chars', () => {
    expect(sanitizeFileName('ficha técnica 2026 (v2).pdf')).toBe(
      'ficha-tecnica-2026-v2.pdf',
    );
  });

  it('never lets path separators through (traversal reduced to basename)', () => {
    expect(sanitizeFileName('../../etc/passwd.pdf')).toMatch(/^[a-z0-9-]*\.pdf$/);
    expect(sanitizeFileName('..\\webs\\x.webp')).toMatch(/^[a-z0-9-]*\.webp$/);
    expect(sanitizeFileName('images/../../pwned.jpg')).toMatch(/^[a-z0-9-]*\.jpg$/);
  });

  it('overrides the local extension with the caller-validated one', () => {
    expect(sanitizeFileName('tricks.exe', { extension: 'pdf' })).toBe('tricks.pdf');
    expect(sanitizeFileName('Foto.JPG', { extension: 'webp' })).toBe('foto.webp');
  });

  it('strips non-word local extensions (extension can never hold separators)', () => {
    expect(sanitizeFileName('plantilla$$.$$$')).toBe('plantilla');
    expect(sanitizeFileName('no-ext')).toBe('no-ext');
    expect(sanitizeFileName('plantilla.exe')).toBe('plantilla.exe');
  });
});

describe('buildProductUploadPath', () => {
  it('always groups uploads under productos/tmp-<uuid>/<name> (create and edit alike)', () => {
    const path = buildProductUploadPath({
      originalName: 'Foto Catálogo.JPG',
      contentType: 'image/jpeg',
    });
    expect(path).toMatch(/^productos\/tmp-[0-9a-f-]{36}\/foto-catalogo\.jpg$/);
  });

  it('maps jpeg/png/webp contentTypes to the right extension for normalized webp', () => {
    const path = buildProductUploadPath({
      originalName: 'raw-jpeg.bin',
      contentType: 'image/webp',
      normalizedExtension: 'webp',
    });
    expect(path.endsWith('.webp')).toBe(true);
  });

  it('derives extension from contentType when direct mapping requested', () => {
    const path = buildProductUploadPath({
      originalName: 'tricks.exe',
      contentType: 'application/pdf',
    });
    expect(path).toMatch(/\.pdf$/);
  });

  it('creates extensionless storage paths when neither the contentType maps nor the local extension is allowlisted', () => {
    const path = buildProductUploadPath({
      originalName: 'doc.???',
      contentType: 'application/octet-stream',
    });
    expect(path.endsWith('/doc')).toBe(true);
  });

  it('truncates overlong stems to 80 chars and falls back to "file" for empty slugs', () => {
    const long = sanitizeFileName('x'.repeat(200) + '.png');
    const stem = long.slice(0, -4);
    expect(stem.length).toBe(80);
    expect(sanitizeFileName('$$$.$$$')).toBe('file');
  });

  it("falls back to a file's own extension when the caller extension is not allowlisted", () => {
    expect(sanitizeFileName('report.png', { extension: '.EXE!' })).toBe('report.png');
    expect(sanitizeFileName('doc.txt')).toBe('doc.txt');
  });

  it('creates extensionless names when neither caller nor local extension are allowlisted', () => {
    expect(sanitizeFileName('doc.???!!!')).toBe('doc');
  });
});
