import sharp from 'sharp';
import { ImageSourcePort } from './ports';

const DEFAULT_RETRIES = 2;
const DEFAULT_MAX_WIDTH_PX = 800;
const DEFAULT_WEBP_QUALITY = 82;
const USER_AGENT = 'Mozilla/5.0 (compatible; RiffMigradorCatalogo/1.0)';
const RETRY_DELAY_MS = 500;

/**
 * Implementación de `ImageSourcePort` que descarga imágenes desde el hosting
 * WordPress antiguo y las optimiza a WebP con `sharp`. Aplica reintentos con
 * backoff ante fallos de red y valida el `content-type` antes de procesar.
 */
export class WordPressImageSource implements ImageSourcePort {
  constructor(
    private readonly retries = DEFAULT_RETRIES,
    private readonly maxWidthPx = DEFAULT_MAX_WIDTH_PX,
    private readonly webpQuality = DEFAULT_WEBP_QUALITY,
  ) {}

  async downloadAndOptimize(url: string): Promise<Buffer> {
    const original = await this.download(url, this.retries);
    return this.buildWebp(original);
  }

  private async download(url: string, attemptsLeft: number): Promise<Buffer> {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al descargar ${url}`);
      }
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`Contenido no es una imagen (content-type: ${contentType}) en ${url}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attemptsLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return this.download(url, attemptsLeft - 1);
      }
      throw err;
    }
  }

  private buildWebp(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize({ width: this.maxWidthPx, withoutEnlargement: true })
      .webp({ quality: this.webpQuality })
      .toBuffer();
  }
}
