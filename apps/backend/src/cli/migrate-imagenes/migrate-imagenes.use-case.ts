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
  REBUILD_NOTIFIER_PORT,
  RebuildNotifierPort,
  RebuildNotifierResult,
  SEED_IMAGE_MAP_LOADER,
  SeedImageMapLoader,
  URL_ACCESSIBILITY_PORT,
  UrlAccessibilityPort,
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
  /** Resultado de la notificación de rebuild; `null` si no se disparó webhook. */
  rebuild: RebuildNotifierResult | null;
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
    @Inject(URL_ACCESSIBILITY_PORT) private readonly urlAccessibility: UrlAccessibilityPort,
    @Inject(REBUILD_NOTIFIER_PORT) private readonly rebuildNotifier: RebuildNotifierPort,
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
      rebuild: null,
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
        this.processDryRun(productoId, titulo, targetUrls, urls.length, truncado, report);
        continue;
      }

      await this.processMigration(productoId, titulo, targetUrls, urls.length, truncado, report);
    }

    // R4: disparar el rebuild del sitio estático solo si hubo cambios reales
    // (al menos un producto migrado) y no estamos en dry-run. El webhook es
    // best-effort: un fallo se reporta en `report.rebuild` sin abortar.
    if (!options.dryRun && report.exitosos.length > 0) {
      report.rebuild = await this.rebuildNotifier.notifyRebuild();
    }

    return report;
  }

  private processDryRun(
    productoId: string,
    titulo: string,
    targetUrls: string[],
    totalUrls: number,
    truncado: boolean,
    report: MigrationReport,
  ): void {
    report.exitosos.push({
      productoId,
      titulo,
      imagenesMigradas: targetUrls.length,
      imagenesTotales: totalUrls,
    });
    if (truncado) {
      report.advertencias.push(this.advertenciaTruncado(productoId, totalUrls));
    }
  }

  private async processMigration(
    productoId: string,
    titulo: string,
    targetUrls: string[],
    totalUrls: number,
    truncado: boolean,
    report: MigrationReport,
  ): Promise<void> {
    const { galeria, erroresImagenes } = await this.buildGaleria(productoId, titulo, targetUrls);

    if (erroresImagenes.length > 0) {
      if (galeria.length > 0) {
        await this.productRepository.update(productoId, { galeria });
      }
      report.fallidos.push({
        productoId,
        titulo,
        imagenesMigradas: galeria.length,
        imagenesTotales: totalUrls,
        motivo: `${erroresImagenes.length} imagen(es) fallaron al migrar`,
        erroresImagenes,
      });
      return;
    }

    if (truncado) {
      report.advertencias.push(this.advertenciaTruncado(productoId, totalUrls));
    }
    await this.productRepository.update(productoId, { galeria });
    report.exitosos.push({
      productoId,
      titulo,
      imagenesMigradas: galeria.length,
      imagenesTotales: totalUrls,
    });
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
      // R6: el dominio no admite URLs relativas en `galeria`. Rechazar la fuente
      // relativa antes de cualquier descarga/subida para no persistirla jamás.
      if (!this.isAbsoluteHttpUrl(url)) {
        erroresImagenes.push({
          orden,
          url,
          error: 'Relative URL rejected: source is not absolute (must start with http:// or https://)',
        });
        continue;
      }
      try {
        const optimized = await this.imageSource.downloadAndOptimize(url);
        const storagePath = `productos/${productoId}/${orden}.webp`;
        const publicUrl = await this.imageStorage.upload(optimized, storagePath);
        const accessible = await this.urlAccessibility.isAccessible(publicUrl);
        if (!accessible) {
          erroresImagenes.push({
            orden,
            url: publicUrl,
            error: 'URL not accessible (HEAD request failed: 403/404 or timeout)',
          });
          continue;
        }
        galeria.push({ url: publicUrl, storagePath, alt: titulo, orden });
      } catch (err) {
        erroresImagenes.push({ orden, url, error: (err as Error).message });
      }
    }

    return { galeria, erroresImagenes };
  }

  /**
   * Valida que la URL de origen sea absoluta y use un esquema http(s) (regla de
   * dominio: galeria solo admite URLs absolutas). Las URLs relativas legacy como
   * `old/galeria/foo.jpg` se rechazan y se registran como fallo sin persistir.
   */
  private isAbsoluteHttpUrl(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  private advertenciaTruncado(productoId: string, totalUrls: number): Advertencia {
    return {
      productoId,
      mensaje: `Se truncaron ${totalUrls - MAX_GALERIA} imagen(es); solo se migran ${MAX_GALERIA}.`,
    };
  }
}
