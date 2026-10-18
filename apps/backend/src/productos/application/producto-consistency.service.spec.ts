import { ConflictException, NotFoundException } from '@nestjs/common';

import { ProductoConsistencyService } from './producto-consistency.service';

// Mock the shared sanitization lib: real sanitization correctness is covered by
// the @riff/html-sanitize Vitest suite. Here we verify the service delegates to
// the right policy function per field and only touches present fields.
jest.mock('@riff/html-sanitize', () => ({
  sanitizeRichHtml: jest.fn((s: string) => `<SAFE>${s}</SAFE>`),
  stripHtmlToText: jest.fn((s: string) => s.replace(/<[^>]*>/g, '').trim()),
}));

import { sanitizeRichHtml, stripHtmlToText } from '@riff/html-sanitize';

describe('ProductoConsistencyService.sanitizeDescriptions', () => {
  const categoriaRepository = { findById: jest.fn() } as never;
  const subcategoriaIntegrity = { belongsToCategoria: jest.fn() } as never;
  const service = new ProductoConsistencyService(
    categoriaRepository,
    subcategoriaIntegrity,
    { sanitizeRichHtml, stripHtmlToText } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('sanitizes descripcionLarga with sanitizeRichHtml and descripcionBreve with stripHtmlToText', () => {
    const out = service.sanitizeDescriptions({
      descripcionLarga: '<p>OK</p><script>x</script>',
      descripcionBreve: '<b>corto</b>',
    });
    expect(sanitizeRichHtml).toHaveBeenCalledWith('<p>OK</p><script>x</script>');
    expect(stripHtmlToText).toHaveBeenCalledWith('<b>corto</b>');
    expect(out.descripcionLarga).toBe('<SAFE><p>OK</p><script>x</script></SAFE>');
    expect(out.descripcionBreve).toBe('corto');
  });

  it('passes raw descripcionLarga to the shared lib (entity decode is its job)', () => {
    service.sanitizeDescriptions({ descripcionLarga: '&lt;p&gt;Hola&lt;/p&gt;' });
    expect(sanitizeRichHtml).toHaveBeenCalledWith('&lt;p&gt;Hola&lt;/p&gt;');
  });

  it('only touches the fields present (partial update input)', () => {
    const out = service.sanitizeDescriptions({
      descripcionBreve: '<i>x</i>',
    } as { descripcionBreve: string; descripcionLarga?: string });
    expect(stripHtmlToText).toHaveBeenCalledWith('<i>x</i>');
    expect(sanitizeRichHtml).not.toHaveBeenCalled();
    expect(out.descripcionLarga).toBeUndefined();
  });
});

describe('ProductoConsistencyService.assertConsistency', () => {
  const findById = jest.fn();
  const belongsToCategoria = jest.fn();
  const service = new ProductoConsistencyService(
    { findById } as never,
    { belongsToCategoria } as never,
    { sanitizeRichHtml, stripHtmlToText } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('defaults a missing categoriaId to sin-categoria and validates it exists', async () => {
    findById.mockResolvedValue({ id: 'sin-categoria' });
    await expect(service.assertConsistency(undefined, null)).resolves.toBe('sin-categoria');
    expect(findById).toHaveBeenCalledWith('sin-categoria');
  });

  it('throws 404 when the effective category does not exist (no subcategoria)', async () => {
    findById.mockResolvedValue(null);
    await expect(service.assertConsistency('c-missing', null)).rejects.toThrow(
      new NotFoundException('Category not found'),
    );
  });

  it('accepts a subcategoria that belongs to the effective category without category lookup', async () => {
    belongsToCategoria.mockResolvedValue(true);
    await expect(service.assertConsistency('c1', 's1')).resolves.toBe('c1');
    expect(belongsToCategoria).toHaveBeenCalledWith('s1', 'c1');
    expect(findById).not.toHaveBeenCalled();
  });

  it('throws 409 when the subcategoria does not belong to the category', async () => {
    belongsToCategoria.mockResolvedValue(false);
    await expect(service.assertConsistency('c1', 's9')).rejects.toThrow(
      new ConflictException('Subcategoria does not belong to the category'),
    );
  });
});
