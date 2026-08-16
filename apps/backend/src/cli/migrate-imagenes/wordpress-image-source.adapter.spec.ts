import { WordPressImageSource } from './wordpress-image-source.adapter';

const OPTIMIZED = Buffer.from('optimized-webp');

interface SharpChain {
  resize: jest.Mock<SharpChain, []>;
  webp: jest.Mock<SharpChain, []>;
  toBuffer: jest.Mock<Promise<Buffer>, []>;
}

jest.mock('sharp', () => {
  const chain: SharpChain = {
    resize: jest.fn(() => chain),
    webp: jest.fn(() => chain),
    toBuffer: jest.fn(() => Promise.resolve(OPTIMIZED)),
  };
  const sharpFn = jest.fn(() => chain);
  return { __esModule: true, default: sharpFn };
});

describe('WordPressImageSource', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockGlobalFetch(res: unknown): void {
    (global as unknown as { fetch: jest.Mock }).fetch = res as jest.Mock;
  }

  it('downloads and optimizes a valid image', async () => {
    const raw = Buffer.from('rawbytes');
    mockGlobalFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'image/jpeg' : null) },
        arrayBuffer: () =>
          Promise.resolve(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)),
      }),
    );
    const src = new WordPressImageSource();
    const result = await src.downloadAndOptimize('http://host/a.jpg');
    expect(result).toBe(OPTIMIZED);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sharp = require('sharp');
    expect(sharp.default).toHaveBeenCalledWith(Buffer.from('rawbytes'));
  });

  it('rejects a non-image content-type', async () => {
    mockGlobalFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? 'text/html' : null) },
        arrayBuffer: () => Promise.resolve(Buffer.from('<html>').buffer),
      }),
    );
    const src = new WordPressImageSource();
    await expect(src.downloadAndOptimize('http://host/a.htm')).rejects.toThrow(/no es una imagen/i);
  });

  it('retries on failure and succeeds', async () => {
    const fail = {
      ok: false,
      status: 500,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: () => Promise.resolve(Buffer.alloc(0)),
    };
    const ok = {
      ok: true,
      status: 200,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: () => Promise.resolve(Buffer.from('raw').buffer),
    };
    mockGlobalFetch(jest.fn().mockResolvedValueOnce(fail).mockResolvedValueOnce(ok));
    const src = new WordPressImageSource();
    const result = await src.downloadAndOptimize('http://host/a.jpg');
    expect(result).toBe(OPTIMIZED);
    expect((global as unknown as { fetch: jest.Mock }).fetch).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    mockGlobalFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: { get: () => 'image/jpeg' },
        arrayBuffer: () => Promise.resolve(Buffer.alloc(0)),
      }),
    );
    const src = new WordPressImageSource();
    await expect(src.downloadAndOptimize('http://host/missing.jpg')).rejects.toThrow(/HTTP 404/i);
    // retries=2 => 1 intento inicial + 2 reintentos = 3 intentos
    expect((global as unknown as { fetch: jest.Mock }).fetch).toHaveBeenCalledTimes(3);
  });
});
