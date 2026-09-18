import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RebuildNotifierPort, RebuildNotifierResult } from './ports';

const REBUILD_URL_ENV = 'CATALOG_REBUILD_WEBHOOK_URL';
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Implementación HTTP de `RebuildNotifierPort` que dispara el rebuild del sitio
 * estático (Astro SSG) con un POST a `CATALOG_REBUILD_WEBHOOK_URL` (leído de
 * configuración, sin lógica hardcodeada de proveedor). Es best-effort: nunca
 * lanza, y devuelve `{ ok: false, reason }` ante cualquier fallo (URL ausente,
 * timeout o error de red, status no 2xx) para que el reporte pueda indicar la
 * necesidad de un rebuild manual sin abortar la migración ya exitosa.
 */
@Injectable()
export class RebuildNotifierHttpAdapter implements RebuildNotifierPort {
  private readonly logger = new Logger(RebuildNotifierHttpAdapter.name);

  constructor(private readonly config: ConfigService) {}

  async notifyRebuild(): Promise<RebuildNotifierResult> {
    const url = this.config.get<string>(REBUILD_URL_ENV);
    if (!url) {
      const reason = `${REBUILD_URL_ENV} not configured; manual rebuild required`;
      this.logger.warn(`[rebuild-notifier] ${reason}`);
      return { ok: false, reason };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) {
        const reason = `webhook responded HTTP ${res.status}; manual rebuild required`;
        this.logger.warn(`[rebuild-notifier] ${reason}`);
        return { ok: false, reason };
      }
      return { ok: true };
    } catch (error) {
      const reason = `webhook request failed: ${String(error)}; manual rebuild required`;
      this.logger.warn(`[rebuild-notifier] ${reason}`);
      return { ok: false, reason };
    }
  }
}