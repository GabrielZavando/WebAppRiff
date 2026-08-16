import { Inject, Injectable } from '@nestjs/common';
import { GaleriaItem } from '@/productos/domain/producto.entity';
import {
  IProductRepository,
  I_PRODUCT_REPOSITORY,
} from '@/productos/domain/iproducto.repository';
import {
  IMAGE_SOURCE_PORT,
  IMAGE_STORAGE_PORT,
  ImageSourcePort,
  ImageStoragePort,
  SEED_IMAGE_MAP_LOADER,
  SeedImageMapLoader,
} from './ports';

export const MAX_GALERIA = 10;

export interface ImagenError {
  orden: number;
  url: string;
  error: string;
}

export interface ProductoMigrado {
  productoId: string;
  titulo: string;
  imagenesMigradas: number;
  imagenesTotales: number;
}

export interface ProductoFallido extends ProductoMigrado {
  motivo: string;
  erroresImagenes: ImagenError[];
}

export interface ProductoOmitido {
  productoId: string;
  motivo: string;
}

export interface Advertencia {
  productoId: string;
  mensaje: string;
}

export interface MigrationReport {
  fecha: string;
  exitosos: ProductoMigrado[];
  fallidos: ProductoFallido[];
  omitidos: ProductoOmitido[];
  advertencias: Advertencia[];
}

/**
 * Caso de uso de migración de imágenes de producto. Por cada entrada del mapa
 * `_imagenesPendientesMigracion` del seed: omite si el documento no existe en
 * Firestore o si ya está migrado completamente (idempotencia por completitud);
 * en caso contrario descarga/optimiza/sube cada imagen vía los puertos
 * inyectados y persiste `galeria` con `IProductRepository.update`. Es tolerante
 * a fallos (continúa con el resto) y emite un reporte. No usa escrituras
 * crudas a Firestore: reusa el repositorio de dominio.
 */
@Injectable()
export class MigrateProductosImagenesUseCase {
  constructor(
    @Inject(I_PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    @Inject(IMAGE_SOURCE_PORT) private readonly imageSource: ImageSourcePort,
    @Inject(IMAGE_STORAGE_PORT) private readonly imageStorage: ImageStoragePort,
    @Inject(SEED_IMAGE_MAP_LOADER) private readonly seedLoader: SeedImageMapLoader,
  ) {}

  async execute(
    seedFilePath?: string,
    options: { dryRun?: boolean } = {},
  ): Promise<MigrationReport> {
    const imageMap = this.seedLoader.load(seedFilePath);
    const report: MigrationReport = {
      fecha: new Date().toISOString(),
      exitosos: [],
      fallidos: [],
      omitidos: [],
      advertencias: [],
    };

    for (const [productoId, urls] of Object.entries(imageMap)) {
      const existing = await this.productRepository.findById(productoId);
      if (!existing) {
        report.omitidos.push({
          productoId,
          motivo: 'El documento no existe en Firestore (probablemente excluido del seed).',
        });
        continue;
      }

      const targetCount = Math.min(urls.length, MAX_GALERIA);
      if (Array.isArray(existing.galeria) && existing.galeria.length >= targetCount) {
        report.omitidos.push({ productoId, motivo: 'Ya migrado completamente (idempotencia).' });
        continue;
      }

      const titulo = existing.titulo;
      const targetUrls = urls.slice(0, MAX_GALERIA);
      const truncado = urls.length > MAX_GALERIA;

      if (options.dryRun) {
        report.exitosos.push({
          productoId,
          titulo,
          imagenesMigradas: targetUrls.length,
          imagenesTotales: urls.length,
        });
        if (truncado) {
          report.advertencias.push(this.advertenciaTruncado(productoId, urls.length));
        }
        continue;
      }

      const { galeria, erroresImagenes } = await this.buildGaleria(productoId, titulo, targetUrls);

      if (erroresImagenes.length > 0) {
        if (galeria.length > 0) {
          await this.productRepository.update(productoId, { galeria });
        }
        report.fallidos.push({
          productoId,
          titulo,
          imagenesMigradas: galeria.length,
          imagenesTotales: urls.length,
          motivo: `${erroresImagenes.length} imagen(es) fallaron al migrar`,
          erroresImagenes,
        });
        continue;
      }

      if (truncado) {
        report.advertencias.push(this.advertenciaTruncado(productoId, urls.length));
      }
      await this.productRepository.update(productoId, { galeria });
      report.exitosos.push({
        productoId,
        titulo,
        imagenesMigradas: galeria.length,
        imagenesTotales: urls.length,
      });
    }

    return report;
  }

  private async buildGaleria(
    productoId: string,
    titulo: string,
    targetUrls: string[],
  ): Promise<{ galeria: GaleriaItem[]; erroresImagenes: ImagenError[] }> {
    const galeria: GaleriaItem[] = [];
    const erroresImagenes: ImagenError[] = [];

    for (let i = 0; i < targetUrls.length; i += 1) {
      const url = targetUrls[i];
      const orden = i + 1;
      try {
        const optimized = await this.imageSource.downloadAndOptimize(url);
        const storagePath = `productos/${productoId}/${orden}.webp`;
        const publicUrl = await this.imageStorage.upload(optimized, storagePath);
        galeria.push({ url: publicUrl, storagePath, alt: titulo, orden });
      } catch (err) {
        erroresImagenes.push({ orden, url, error: (err as Error).message });
      }
    }

    return { galeria, erroresImagenes };
  }

  private advertenciaTruncado(productoId: string, totalUrls: number): Advertencia {
    return {
      productoId,
      mensaje: `Se truncaron ${totalUrls - MAX_GALERIA} imagen(es); solo se migran ${MAX_GALERIA}.`,
    };
  }
}
