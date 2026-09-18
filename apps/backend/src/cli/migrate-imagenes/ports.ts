import { GaleriaItem } from '@/productos/domain/producto.entity';

/**
 * Puerto de descarga + optimización de imágenes. La implementación concreta
 * (WordPressImageSource) usa `fetch` + `sharp`, pero el use-case depende solo
 * de esta abstracción (DIP, testeable con fakes).
 */
export interface ImageSourcePort {
  /** Descarga la imagen desde la URL y la devuelve como buffer WebP optimizado. */
  downloadAndOptimize(url: string): Promise<Buffer>;
}

/**
 * Puerto de subida de imágenes a Storage. La implementación concreta
 * (FirebaseStorageUploader) usa firebase-admin/storage y devuelve la URL pública.
 */
export interface ImageStoragePort {
  /** Sube el buffer a `storagePath` y devuelve la URL pública resultante. */
  upload(buffer: Buffer, storagePath: string): Promise<string>;
}

/**
 * Puerto de validación de accesibilidad pública de una URL de imagen.
 * La implementación concreta hace un HTTP HEAD request y devuelve `true` solo
 * si la URL responde HTTP 200; 403/404/timeout se consideran no accesibles.
 * Abstracción de dominio: sin imports de infraestructura.
 */
export interface UrlAccessibilityPort {
  /** Devuelve `true` si la URL es públicamente accesible (HTTP 200). */
  isAccessible(url: string): Promise<boolean>;
}

/** Mapa productoId -> arreglo de URLs de imagen origen (legacy WordPress). */
export type SeedImageMap = Record<string, string[]>;

/**
 * Puerto de carga del mapa de imágenes pendientes desde el archivo seed.
 * La implementación concreta (SeedImageMapLoaderImpl) lee `_imagenesPendientesMigracion`.
 */
export interface SeedImageMapLoader {
  load(seedFilePath?: string): SeedImageMap;
}

/**
 * Resultado de la notificación de rebuild del sitio estático. `ok: true` indica
 * que el webhook respondió 2xx; `ok: false` (con `reason`) indica un fallo que
 * requiere rebuild manual, sin abortar la migración ya exitosa.
 */
export interface RebuildNotifierResult {
  ok: boolean;
  reason?: string;
}

/**
 * Puerto de notificación de rebuild del sitio estático (Astro SSG). La
 * implementación concreta hace un HTTP POST a `CATALOG_REBUILD_WEBHOOK_URL`
 * leído de configuración. El webhook es best-effort: nunca debe lanzar; un
 * fallo se reporta en el resultado para que el reporte indique rebuild manual.
 */
export interface RebuildNotifierPort {
  /** POSTs al webhook de rebuild y devuelve el resultado sin lanzar. */
  notifyRebuild(): Promise<RebuildNotifierResult>;
}

export const IMAGE_SOURCE_PORT = 'IMAGE_SOURCE_PORT';
export const IMAGE_STORAGE_PORT = 'IMAGE_STORAGE_PORT';
export const SEED_IMAGE_MAP_LOADER = 'SEED_IMAGE_MAP_LOADER';
export const URL_ACCESSIBILITY_PORT = 'URL_ACCESSIBILITY_PORT';
export const REBUILD_NOTIFIER_PORT = 'REBUILD_NOTIFIER_PORT';

export type { GaleriaItem };
