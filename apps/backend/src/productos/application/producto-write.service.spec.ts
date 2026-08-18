import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ProductoWriteService } from './producto-write.service';
import { ProductoCreateDto } from '../infrastructure/producto-create.dto';
import { ProductoUpdateDto } from '../infrastructure/producto-update.dto';

describe('ProductoWriteService', () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const integrity = {
    existsBySku: jest.fn(),
    existsBySlug: jest.fn(),
  };
  const consistency = {
    assertConsistency: jest.fn(),
    sanitizeDescriptions: jest.fn((d: { descripcionLarga?: string; descripcionBreve?: string }) => ({
      ...d,
    })),
  };

  const service = new ProductoWriteService(
    repository as never,
    integrity as never,
    consistency as never,
  );

  const baseProduct = {
    id: 'p1',
    idExterno: null,
    sku: 'SKU-1',
    titulo: 'Válvula',
    slug: 'valvula',
    descripcionBreve: '',
    descripcionLarga: '',
    categoriaId: 'cat-1',
    subcategoriaId: null,
    atributos: [],
    precio: { valor: 0, visible: false },
    stock: { disponible: true, cantidad: null },
    galeria: [],
    fichaTecnica: null,
    destacado: false,
    publicado: true,
    creadoEn: new Date(),
    actualizadoEn: new Date(),
  };

  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: ProductoCreateDto = { sku: 'SKU-1', titulo: 'Válvula' } as ProductoCreateDto;

    it('creates with auto-generated slug and default categoria', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(false);
      consistency.assertConsistency.mockResolvedValue('sin-categoria');
      repository.create.mockResolvedValue(baseProduct);

      await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: 'SKU-1',
          slug: 'valvula',
          categoriaId: 'sin-categoria',
          subcategoriaId: null,
        }),
      );
    });

    it('rejects duplicate SKU with 409', async () => {
      integrity.existsBySku.mockResolvedValue(true);
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects duplicate auto-generated slug with 409', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(true);
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('propagates 404 when the category does not exist', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(false);
      consistency.assertConsistency.mockRejectedValue(new NotFoundException());
      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('propagates 409 when the subcategory is inconsistent', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(false);
      consistency.assertConsistency.mockRejectedValue(new ConflictException());
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a gallery with more than 10 images with 422', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(false);
      consistency.assertConsistency.mockResolvedValue('cat-1');
      const bigDto = {
        sku: 'S',
        titulo: 'T',
        galeria: Array.from({ length: 11 }, () => ({ url: 'u', storagePath: 'p', alt: 'a', orden: 1 })),
      } as ProductoCreateDto;
      await expect(service.create(bigDto)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('rejects a non-PDF ficha tecnica with 422', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(false);
      consistency.assertConsistency.mockResolvedValue('cat-1');
      const fichaDto = {
        sku: 'S',
        titulo: 'T',
        fichaTecnica: { url: 'u', storagePath: 'p', nombreArchivo: 'doc.txt' },
      } as ProductoCreateDto;
      await expect(service.create(fichaDto)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('sanitizes descriptions before persisting on create', async () => {
      integrity.existsBySku.mockResolvedValue(false);
      integrity.existsBySlug.mockResolvedValue(false);
      consistency.assertConsistency.mockResolvedValue('cat-1');
      consistency.sanitizeDescriptions.mockImplementation((d: { descripcionLarga?: string; descripcionBreve?: string }) => {
        if (d.descripcionLarga !== undefined) d.descripcionLarga = '<p>OK</p>';
        if (d.descripcionBreve !== undefined) d.descripcionBreve = 'corto';
        return d;
      });
      repository.create.mockResolvedValue(baseProduct);
      const dto = {
        sku: 'S',
        titulo: 'T',
        descripcionLarga: '<p>OK</p><script>x</script>',
        descripcionBreve: '<b>corto</b>',
      } as ProductoCreateDto;

      await service.create(dto);

      expect(consistency.sanitizeDescriptions).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ descripcionLarga: '<p>OK</p>', descripcionBreve: 'corto' }),
      );
    });
  });

  describe('update', () => {
    it('updates when the product exists', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      repository.update.mockResolvedValue({ ...baseProduct, publicado: false });
      const dto = { publicado: false } as ProductoUpdateDto;
      const result = await service.update('p1', dto);
      expect(repository.update).toHaveBeenCalledWith('p1', dto);
      expect(result.publicado).toBe(false);
    });

    it('rejects updating a missing product with 404', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.update('x', {} as ProductoUpdateDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('rejects a changed SKU that collides with 409', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      integrity.existsBySku.mockResolvedValue(true);
      const dto = { sku: 'SKU-OTHER' } as ProductoUpdateDto;
      await expect(service.update('p1', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a changed slug that collides with 409', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      integrity.existsBySlug.mockResolvedValue(true);
      const dto = { slug: 'other' } as ProductoUpdateDto;
      await expect(service.update('p1', dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('allows keeping the same SKU and slug (no self-collision)', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      repository.update.mockResolvedValue(baseProduct);
      const dto = { sku: 'SKU-1', slug: 'valvula' } as ProductoUpdateDto;
      await expect(service.update('p1', dto)).resolves.toBeDefined();
      expect(integrity.existsBySku).not.toHaveBeenCalled();
    });

    it('rejects a gallery with more than 10 images with 422', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      const dto = {
        galeria: Array.from({ length: 11 }, () => ({ url: 'u', storagePath: 'p', alt: 'a', orden: 1 })),
      } as ProductoUpdateDto;
      await expect(service.update('p1', dto)).rejects.toBeInstanceOf(UnprocessableEntityException);
    });

    it('validates consistency when category/subcategory changes', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      consistency.assertConsistency.mockRejectedValue(new NotFoundException());
      const dto = { categoriaId: 'missing' } as ProductoUpdateDto;
      await expect(service.update('p1', dto)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sanitizes descriptions before persisting on update', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      consistency.sanitizeDescriptions.mockImplementation((d: { descripcionLarga?: string; descripcionBreve?: string }) => {
        if (d.descripcionLarga !== undefined) d.descripcionLarga = '<p>New</p>';
        if (d.descripcionBreve !== undefined) d.descripcionBreve = 'txt';
        return d;
      });
      repository.update.mockResolvedValue(baseProduct);
      const dto = {
        descripcionLarga: '<div>New</div>',
        descripcionBreve: '<i>txt</i>',
      } as ProductoUpdateDto;

      await service.update('p1', dto);

      expect(consistency.sanitizeDescriptions).toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(
        'p1',
        expect.objectContaining({ descripcionLarga: '<p>New</p>', descripcionBreve: 'txt' }),
      );
    });
  });

  describe('remove', () => {
    it('removes an existing product', async () => {
      repository.findById.mockResolvedValue(baseProduct);
      repository.remove.mockResolvedValue(undefined);
      await service.remove('p1');
      expect(repository.remove).toHaveBeenCalledWith('p1');
    });

    it('rejects removing a missing product with 404', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
