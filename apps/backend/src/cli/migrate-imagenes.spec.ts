import { Test } from '@nestjs/testing';
import { writeFileSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  IMAGE_SOURCE_PORT,
  IMAGE_STORAGE_PORT,
  SEED_IMAGE_MAP_LOADER,
} from './migrate-imagenes/ports';
import { I_PRODUCT_REPOSITORY } from '@/productos/domain/iproducto.repository';
import { MigrateProductosImagenesUseCase } from './migrate-imagenes/migrate-imagenes.use-case';
import { SeedImageMapLoaderImpl } from './migrate-imagenes/seed-image-map.loader';

/**
 * Verifica el "cableado" del comando CLI de migración de imágenes sin tocar
 * Firebase: `SeedImageMapLoaderImpl` (real) + `MigrateProductosImagenesUseCase`
 * resueltos en un módulo de testing con los puertos/repositorio mockeados.
 */
describe('migrate:productos:imagenes CLI wiring', () => {
  const productoRepo = {
    findById: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };
  const imageSource = { downloadAndOptimize: jest.fn() };
  const imageStorage = { upload: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    productoRepo.findById.mockImplementation((id: string) =>
      id === 'prod-054'
        ? Promise.resolve(null)
        : Promise.resolve({ titulo: 'Prod', galeria: [] }),
    );
    imageSource.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    imageStorage.upload.mockImplementation((_b: Buffer, p: string) =>
      Promise.resolve(`https://storage/${p}`),
    );
  });

  it('resolves ports via DI and migrates a real seed map', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'riff-img-')); // eslint-disable-line
    const filePath = join(dir, 'seed.json');
    writeFileSync(
      filePath,
      JSON.stringify({
        _imagenesPendientesMigracion: {
          'prod-001': ['http://h/1.jpg'],
          'prod-054': ['http://h/2.jpg'],
          'prod-002': ['http://h/3.jpg', 'http://h/4.jpg'],
        },
      }),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        MigrateProductosImagenesUseCase,
        { provide: SEED_IMAGE_MAP_LOADER, useClass: SeedImageMapLoaderImpl },
        { provide: I_PRODUCT_REPOSITORY, useValue: productoRepo },
        { provide: IMAGE_SOURCE_PORT, useValue: imageSource },
        { provide: IMAGE_STORAGE_PORT, useValue: imageStorage },
      ],
    }).compile();

    const useCase = moduleRef.get(MigrateProductosImagenesUseCase);
    const report = await useCase.execute(filePath);

    expect(report.exitosos.map((e) => e.productoId)).toEqual(
      expect.arrayContaining(['prod-001', 'prod-002']),
    );
    expect(report.omitidos.map((o) => o.productoId)).toContain('prod-054');
    expect(imageStorage.upload).toHaveBeenCalledWith(expect.any(Buffer), 'productos/prod-002/2.webp');
    expect(productoRepo.update).toHaveBeenCalledTimes(2);
  });

  it('fails fast when the seed file is malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'riff-img-')); // eslint-disable-line
    const filePath = join(dir, 'bad.json');
    writeFileSync(filePath, '{ not valid');
    expect(() => new SeedImageMapLoaderImpl().load(filePath)).toThrow(/JSON válido/i);
  });
});
