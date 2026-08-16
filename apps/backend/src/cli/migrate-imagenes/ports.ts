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

/** Mapa productoId -> arreglo de URLs de imagen origen (legacy WordPress). */
export type SeedImageMap = Record<string, string[]>;

/**
 * Puerto de carga del mapa de imágenes pendientes desde el archivo seed.
 * La implementación concreta (SeedImageMapLoaderImpl) lee `_imagenesPendientesMigracion`.
 */
export interface SeedImageMapLoader {
  load(seedFilePath?: string): SeedImageMap;
}

export const IMAGE_SOURCE_PORT = 'IMAGE_SOURCE_PORT';
export const IMAGE_STORAGE_PORT = 'IMAGE_STORAGE_PORT';
export const SEED_IMAGE_MAP_LOADER = 'SEED_IMAGE_MAP_LOADER';

export type { GaleriaItem };
