import { MigrateProductosImagenesUseCase } from './migrate-imagenes.use-case';
import { IProductRepository } from '@/productos/domain/iproducto.repository';

describe('MigrateProductosImagenesUseCase', () => {
  const source = { downloadAndOptimize: jest.fn() };
  const storage = { upload: jest.fn() };
  const loader = { load: jest.fn() };
  const urlAccessibility = { isAccessible: jest.fn() };
  const rebuildNotifier = { notifyRebuild: jest.fn() };
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
      urlAccessibility as never,
      rebuildNotifier as never,
    );
    urlAccessibility.isAccessible.mockResolvedValue(true);
    rebuildNotifier.notifyRebuild.mockResolvedValue({ ok: true });
    storage.upload.mockImplementation((_b: Buffer, path: string) =>
      Promise.resolve(`https://storage/${path}`),
    );
  });

  it('omits products whose Firestore document does not exist (e.g. prod-054)', async () => {
    loader.load.mockReturnValue({ 'prod-054': ['https://legacy/a.jpg'] });
    repo.findById.mockResolvedValue(null);
    const report = await uc.execute();
    expect(report.omitidos.map((o) => o.productoId)).toContain('prod-054');
    expect(repo.update).not.toHaveBeenCalled();
    expect(source.downloadAndOptimize).not.toHaveBeenCalled();
  });

  it('skips already fully-migrated products (idempotency by completeness)', async () => {
    loader.load.mockReturnValue({ 'prod-001': ['https://legacy/a.jpg', 'https://legacy/b.jpg'] });
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
    loader.load.mockReturnValue({ 'prod-002': ['https://legacy/a.jpg', 'https://legacy/b.jpg'] });
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
    loader.load.mockReturnValue({ 'prod-003': ['https://legacy/ok.jpg', 'https://legacy/fail.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'C', galeria: [] });
    source.downloadAndOptimize.mockImplementation((url: string) =>
      url === 'https://legacy/fail.jpg'
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
      'prod-004': Array.from({ length: 11 }, (_, i) => `https://legacy/img-${i}.jpg`),
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
    loader.load.mockReturnValue({ 'prod-005': ['https://legacy/a.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'E', galeria: [] });
    const report = await uc.execute(undefined, { dryRun: true });
    expect(source.downloadAndOptimize).not.toHaveBeenCalled();
    expect(storage.upload).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-005');
  });

  it('persists the URL in galeria when it is publicly accessible (HTTP 200)', async () => {
    loader.load.mockReturnValue({ 'prod-007': ['https://legacy/a.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'G', galeria: [] });
    source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    urlAccessibility.isAccessible.mockResolvedValue(true);
    const report = await uc.execute();
    expect(urlAccessibility.isAccessible).toHaveBeenCalledWith(
      'https://storage/productos/prod-007/1.webp',
    );
    expect(repo.update).toHaveBeenCalledWith(
      'prod-007',
      expect.objectContaining({
        galeria: expect.arrayContaining([
          expect.objectContaining({ url: 'https://storage/productos/prod-007/1.webp' }),
        ]),
      }),
    );
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-007');
  });

  it.each([
    ['403 Forbidden', 'HTTP 403'],
    ['404 Not Found', 'HTTP 404'],
    ['timeout', 'timeout'],
  ])(
    'does NOT persist the URL and records it as failed when the HEAD check reports %s',
    async (_caseLabel, cause) => {
      loader.load.mockReturnValue({ 'prod-008': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue({ titulo: 'H', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      urlAccessibility.isAccessible.mockResolvedValue(false);
      const report = await uc.execute();
      expect(repo.update).not.toHaveBeenCalled();
      expect(report.exitosos).toHaveLength(0);
      expect(report.fallidos.map((f) => f.productoId)).toContain('prod-008');
      expect(report.fallidos[0].erroresImagenes).toEqual([
        expect.objectContaining({
          orden: 1,
          url: 'https://storage/productos/prod-008/1.webp',
          error: expect.stringMatching(/not accessible|inaccessible/i),
        }),
      ]);
    },
  );

  it('persists only accessible URLs when a product has mixed results', async () => {
    loader.load.mockReturnValue({ 'prod-009': ['https://legacy/ok.jpg', 'https://legacy/bad.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'I', galeria: [] });
    source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    urlAccessibility.isAccessible
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const report = await uc.execute();
    expect(repo.update).toHaveBeenCalledWith(
      'prod-009',
      expect.objectContaining({
        galeria: [
          expect.objectContaining({ url: 'https://storage/productos/prod-009/1.webp' }),
        ],
      }),
    );
    expect(report.fallidos.map((f) => f.productoId)).toContain('prod-009');
    expect(report.fallidos[0].erroresImagenes[0]).toEqual(
      expect.objectContaining({
        url: 'https://storage/productos/prod-009/2.webp',
        error: expect.stringMatching(/not accessible|inaccessible/i),
      }),
    );
  });

  it('migrates successfully when all images succeed', async () => {
    loader.load.mockReturnValue({ 'prod-006': ['https://legacy/a.jpg', 'https://legacy/b.jpg'] });
    repo.findById.mockResolvedValue({ titulo: 'F', galeria: [] });
    source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
    const report = await uc.execute();
    expect(report.exitosos.map((e) => e.productoId)).toContain('prod-006');
    expect(repo.update).toHaveBeenCalledTimes(1);
    expect(report.fallidos).toHaveLength(0);
  });

  describe('T4 — Idempotency / retry of omitted products & complete report (R2/R3, SC-003/SC-004)', () => {
    it('re-run omits fully-migrated products WITHOUT creating duplicate Storage objects', async () => {
      loader.load.mockReturnValue({ 'prod-030': ['https://legacy/a.jpg', 'https://legacy/b.jpg'] });
      repo.findById.mockResolvedValue({
        titulo: 'R',
        galeria: [
          { url: 'x', storagePath: 'y', alt: 'R', orden: 1 },
          { url: 'x', storagePath: 'y', alt: 'R', orden: 2 },
        ],
      });
      const report = await uc.execute();
      expect(report.omitidos.map((o) => o.productoId)).toContain('prod-030');
      expect(report.omitidos[0].motivo).toMatch(/idempotencia/i);
      expect(storage.upload).not.toHaveBeenCalled();
      expect(source.downloadAndOptimize).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('re-run retries a previously-failed product (partial galeria from a prior fallido), NOT skipping it', async () => {
      // Previous run: image 1 succeeded, image 2 failed -> partial galeria (1 of 2) + fallido.
      loader.load.mockReturnValue({ 'prod-031': ['https://legacy/a.jpg', 'https://legacy/b.jpg'] });
      repo.findById.mockResolvedValue({
        titulo: 'S',
        galeria: [
          {
            url: 'https://storage/productos/prod-031/1.webp',
            storagePath: 'productos/prod-031/1.webp',
            alt: 'S',
            orden: 1,
          },
        ],
      });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(report.omitidos.map((o) => o.productoId)).not.toContain('prod-031');
      expect(report.exitosos.map((e) => e.productoId)).toContain('prod-031');
      expect(storage.upload).toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalled();
    });

    it('re-run retries a previously-failed product whose partial run had ZERO galeria written', async () => {
      // Previous run: the only image failed accessibility -> galeria empty + fallido.
      loader.load.mockReturnValue({ 'prod-032': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue({ titulo: 'S', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(report.omitidos.map((o) => o.productoId)).not.toContain('prod-032');
      expect(report.exitosos.map((e) => e.productoId)).toContain('prod-032');
      expect(storage.upload).toHaveBeenCalled();
    });

    it('a product whose document does not exist stays omitido (not retried, no writes)', async () => {
      loader.load.mockReturnValue({ 'prod-033': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue(null);
      const report = await uc.execute();
      expect(report.omitidos.map((o) => o.productoId)).toContain('prod-033');
      expect(report.omitidos[0].motivo).toBeTruthy();
      expect(storage.upload).not.toHaveBeenCalled();
      expect(source.downloadAndOptimize).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('every omitido entry carries a non-empty motivo (R3 — no reasonless omissions)', async () => {
      loader.load.mockReturnValue({
        'prod-noexist': ['https://legacy/a.jpg'],
        'prod-migrado': ['https://legacy/a.jpg', 'https://legacy/b.jpg'],
        'prod-pendiente-sin-doc': ['https://legacy/c.jpg'],
      });
      repo.findById.mockImplementation((id: string) => {
        if (id === 'prod-migrado') {
          return Promise.resolve({
            titulo: 'M',
            galeria: [
              { url: 'x', storagePath: 'y', alt: 'M', orden: 1 },
              { url: 'x', storagePath: 'y', alt: 'M', orden: 2 },
            ],
          });
        }
        return Promise.resolve(null);
      });
      const report = await uc.execute();
      expect(report.omitidos.length).toBeGreaterThan(0);
      for (const o of report.omitidos) {
        expect(typeof o.motivo).toBe('string');
        expect(o.motivo.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('RebuildNotifier integration (SC-005)', () => {
    it('fires the rebuild webhook when at least one product was migrated', async () => {
      loader.load.mockReturnValue({ 'prod-020': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue({ titulo: 'T', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(rebuildNotifier.notifyRebuild).toHaveBeenCalledTimes(1);
      expect(report.rebuild).toEqual({ ok: true });
    });

    it('does NOT fire the rebuild webhook when nothing changed (no exitosos)', async () => {
      loader.load.mockReturnValue({ 'prod-021': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue(null); // document missing -> omitted, no changes
      const report = await uc.execute();
      expect(report.exitosos).toHaveLength(0);
      expect(rebuildNotifier.notifyRebuild).not.toHaveBeenCalled();
      expect(report.rebuild).toBeNull();
    });

    it('does NOT fire the rebuild webhook in dry-run mode', async () => {
      loader.load.mockReturnValue({ 'prod-022': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue({ titulo: 'U', galeria: [] });
      const report = await uc.execute(undefined, { dryRun: true });
      expect(report.exitosos.map((e) => e.productoId)).toContain('prod-022');
      expect(rebuildNotifier.notifyRebuild).not.toHaveBeenCalled();
      expect(report.rebuild).toBeNull();
    });

    it('surfaces a webhook failure as a report field without aborting a successful migration', async () => {
      rebuildNotifier.notifyRebuild.mockResolvedValue({
        ok: false,
        reason: 'CATALOG_REBUILD_WEBHOOK_URL not configured; manual rebuild required',
      });
      loader.load.mockReturnValue({ 'prod-023': ['https://legacy/a.jpg'] });
      repo.findById.mockResolvedValue({ titulo: 'V', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(report.exitosos.map((e) => e.productoId)).toContain('prod-023');
      expect(report.rebuild).toEqual({
        ok: false,
        reason: expect.stringMatching(/manual rebuild/),
      });
    });
  });

  describe('T6 — Domain rules enforcement: max 10 images & absolute URLs only (R6, SC-001/SC-004)', () => {
    it('regression: product with >10 pending images migrates EXACTLY 10 and records a truncation warning', async () => {
      loader.load.mockReturnValue({
        'prod-040': Array.from({ length: 15 }, (_, i) => `https://legacy/x/img-${i}.webp`),
      });
      repo.findById.mockResolvedValue({ titulo: 'REG', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(storage.upload).toHaveBeenCalledTimes(10);
      expect(report.exitosos.map((e) => e.productoId)).toContain('prod-040');
      const migrado = report.exitosos.find((e) => e.productoId === 'prod-040');
      expect(migrado).toBeDefined();
      expect((migrado as { imagenesMigradas: number }).imagenesMigradas).toBe(10);
      expect((migrado as { imagenesTotales: number }).imagenesTotales).toBe(15);
      const advertencia = report.advertencias.find((a) => a.productoId === 'prod-040');
      expect(advertencia).toBeDefined();
      expect((advertencia as { mensaje: string }).mensaje).toMatch(/10/);
      expect((advertencia as { mensaje: string }).mensaje).toMatch(/trunc/i);
      const updateCall = repo.update.mock.calls.find(([id]) => id === 'prod-040');
      expect(updateCall).toBeDefined();
      const galeria = updateCall[1].galeria as Array<{ url: string; orden: number }>;
      expect(galeria).toHaveLength(10);
      expect(galeria.map((item) => item.orden)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      for (const item of galeria) {
        expect(item.url).toMatch(/^https?:\/\//);
      }
    });

    it('regression: a relative legacy URL is never persisted and is recorded as failed with a clear cause', async () => {
      loader.load.mockReturnValue({ 'prod-041': ['old/galeria/foo.jpg'] });
      repo.findById.mockResolvedValue({ titulo: 'REL', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(source.downloadAndOptimize).not.toHaveBeenCalled();
      expect(storage.upload).not.toHaveBeenCalled();
      expect(repo.update).not.toHaveBeenCalled();
      expect(report.exitosos).toHaveLength(0);
      expect(report.fallidos.map((f) => f.productoId)).toContain('prod-041');
      const fallido = report.fallidos[0];
      expect(fallido.erroresImagenes).toEqual([
        expect.objectContaining({
          orden: 1,
          url: 'old/galeria/foo.jpg',
          error: expect.stringMatching(/relative|absolute/i),
        }),
      ]);
    });

    it('regression: among mixed sources, only absolute URLs migrate and relative ones are excluded from galeria (never persisted)', async () => {
      loader.load.mockReturnValue({
        'prod-042': ['https://legacy/a.webp', 'old/galeria/bar.jpg', 'https://legacy/b.webp'],
      });
      repo.findById.mockResolvedValue({ titulo: 'MIX', galeria: [] });
      source.downloadAndOptimize.mockResolvedValue(Buffer.from('opt'));
      const report = await uc.execute();
      expect(storage.upload).toHaveBeenCalledTimes(2);
      // A product with any failed image is classified as fallido (existing contract).
      expect(report.fallidos.map((f) => f.productoId)).toContain('prod-042');
      const updateCall = repo.update.mock.calls.find(([id]) => id === 'prod-042');
      expect(updateCall).toBeDefined();
      const galeria = updateCall[1].galeria as Array<{ url: string }>;
      expect(galeria).toHaveLength(2);
      for (const item of galeria) {
        expect(item.url).toMatch(/^https?:\/\//);
        expect(item.url).not.toContain('old/galeria');
      }
      expect(report.fallidos[0].erroresImagenes).toEqual([
        expect.objectContaining({
          url: 'old/galeria/bar.jpg',
          error: expect.stringMatching(/relative|absolute/i),
        }),
      ]);
    });
  });
});
