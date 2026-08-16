import { MigrateProductosImagenesUseCase } from './migrate-imagenes.use-case';
import { IProductRepository } from '@/productos/domain/iproducto.repository';

describe('MigrateProductosImagenesUseCase', () => {
  const source = { downloadAndOptimize: jest.fn() };
  const storage = { upload: jest.fn() };
  const loader = { load: jest.fn() };
  let repo: {
    findById: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    remove: jest.Mock;
  };
  let uc: MigrateProductosImagenesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = {
      findById: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),
    };
    uc = new MigrateProductosImagenesUseCase(
      repo as unknown as IProductRepository,
      source as never,
      storage as never,
      loader as never,
    );
    storage.upload.mockImplementation((_b: Buffer, path: string) =>
      Promise.resolve(`https://storage/${path}`),
    );
  });

  it('omits products whose Firestore document does not exist (e.g. prod-054)', async () => {
    loader.load.mockReturnValue({ 'prod-054': ['a.jpg'] });
    repo.findById.mockResolvedValue(null);
    const report = await uc.execute();
    expect(report.omitidos.map((o) => o.productoId)).toContain('prod-054');
    expect(repo.update).not.toHaveBeenCalled();
    expect(source.downloadAndOptimize).not.toHaveBeenCalled();
  });

  it('skips already fully-migrated products (idempotency by completeness)', async () => {
    loader.load.mockReturnValue({ 'prod-001': ['a.jpg', 'b.jpg'] });
    repo.findById.mockResolvedValue({
      titulo: 'A',
      galeria: [
        { url: 'x', storagePath: 'y', alt: 'A', orden: 1 },
        { url: 'x', storagePath: 'y', alt: 'A', orden: 2 },
      ],
    });
    const report = await uc.execute();
    expect(report.omitidos.map((o) => o.productoId)).toContain('prod-001');
    expect(report.omitidos[0].motivo).toMatch(/idempotencia/i);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('completes a partial migration on re-run', async () => {
    loader.load.mockReturnValue({ 'prod-002': ['a.jpg', 'b.jpg'] });
    repo.findById.mockResolvedValue({
      titulo: 'B',
      galeria: [{ url: 'x', storagePath: 'y', alt: 'B', orden: 1 }],
    });
    source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    const report = await uc.execute();
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-002');
    expect(repo.update).toHaveBeenCalledWith(
      'prod-002',
      expect.objectContaining({
        galeria: expect.arrayContaining([expect.objectContaining({ orden: 2 })]),
      }),
    );
  });

  it('reports a product with failing images as fallido and writes the partial galeria', async () => {
    loader.load.mockReturnValue({ 'prod-003': ['ok.jpg', 'fail.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'C', galeria: [] });
    source.downloadAndOptimize.mockImplementation((url: string) =>
      url === 'fail.jpg'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve(Buffer.from('opt')),
    );
    const report = await uc.execute();
    expect(report.fallidos.map((f) => f.productoId)).toContain('prod-003');
    expect(report.fallidos[0].erroresImagenes).toHaveLength(1);
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith(
      'prod-003',
      expect.objectContaining({
        galeria: expect.arrayContaining([expect.objectContaining({ orden: 1 })]),
      }),
    );
  });

  it('truncates beyond 10 images and records a warning', async () => {
    loader.load.mockReturnValue({
      'prod-004': Array.from({ length: 11 }, (_, i) => `img-${i}.jpg`),
    });
    repo.findById.mockResolvedValue({ titulo: 'D', galeria: [] });
    source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    const report = await uc.execute();
    expect(storage.upload).toHaveBeenCalledTimes(10);
    expect(repo.update).toHaveBeenCalledWith(
      'prod-004',
      expect.objectContaining({
        galeria: expect.arrayContaining([expect.objectContaining({ orden: 10 })]),
      }),
    );
    expect(report.advertencias.map((a) => a.productoId)).toContain('prod-004');
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-004');
  });

  it('performs no writes in dry-run mode but reports what would migrate', async () => {
    loader.load.mockReturnValue({ 'prod-005': ['a.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'E', galeria: [] });
    const report = await uc.execute(undefined, { dryRun: true });
    expect(source.downloadAndOptimize).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-005');
  });

  it('migrates successfully when all images succeed', async () => {
    loader.load.mockReturnValue({ 'prod-006': ['a.jpg', 'b.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'F', galeria: [] });
    source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    const report = await uc.execute();
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-006');
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(report.fallidos).toHaveLength(0);
  });
});
