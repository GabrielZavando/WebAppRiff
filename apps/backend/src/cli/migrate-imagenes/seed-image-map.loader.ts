import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { SeedImageMap, SeedImageMapLoader } from './ports';

const DEFAULT_SEED_FILE_NAME = 'seed-productos-71.json';

/**
 * Carga el mapa `_imagenesPendientesMigracion` desde el archivo seed. El mapa
 * mantiene separadas las URLs del hosting antiguo de WordPress del modelo de
 * producto (la `galeria` se pobló vacía en el seed a propósito). Valida la
 * forma del JSON antes de devolverlo para fallar rápido ante un seed inválido.
 */
export class SeedImageMapLoaderImpl implements SeedImageMapLoader {
  constructor(private readonly defaultSeedPath?: string) {}

  load(seedFilePath?: string): SeedImageMap {
    const resolved = this.resolvePath(seedFilePath);
    let raw: string;
    try {
      raw = readFileSync(resolved, 'utf-8');
    } catch (err) {
      throw new Error(`No se pudo leer el archivo seed en "${resolved}": ${(err as Error).message}`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`El archivo seed "${resolved}" no es JSON válido: ${(err as Error).message}`);
    }

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`El archivo seed "${resolved}" debe contener un objeto JSON`);
    }

    return this.parseImageMap(resolved, parsed as Record<string, unknown>);
  }

  private parseImageMap(
    seedPath: string,
    parsed: Record<string, unknown>,
  ): SeedImageMap {
    const map = parsed._imagenesPendientesMigracion;
    if (typeof map !== 'object' || map === null || Array.isArray(map)) {
      throw new Error(`El seed "${seedPath}" no contiene "_imagenesPendientesMigracion" como objeto`);
    }

    const result: SeedImageMap = {};
    for (const [id, urls] of Object.entries(map)) {
      if (!Array.isArray(urls) || !urls.every((u) => typeof u === 'string')) {
        throw new Error(`"_imagenesPendientesMigracion.${id}" debe ser un arreglo de strings`);
      }
      result[id] = urls;
    }
    return result;
  }

  private resolvePath(seedFilePath?: string): string {
    const explicit = seedFilePath ?? this.defaultSeedPath;
    if (explicit) {
      return isAbsolute(explicit) ? explicit : resolve(process.cwd(), explicit);
    }
    let dir = process.cwd();
    for (let level = 0; level < 6; level += 1) {
      const candidate = join(dir, DEFAULT_SEED_FILE_NAME);
      if (existsSync(candidate)) return candidate;
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return resolve(process.cwd(), DEFAULT_SEED_FILE_NAME);
  }
}
