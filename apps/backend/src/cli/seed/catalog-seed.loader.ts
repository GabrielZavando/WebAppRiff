import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { slugify } from '@/common/utils/slugify';

export type CatalogSeedCategory = {
  id: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
  esDefault: boolean;
};

export type CatalogSeedSubcategoria = {
  id: string;
  categoriaId: string;
  nombre: string;
  slug: string;
  orden: number;
  activa: boolean;
};

export type CatalogSeed = {
  categorias: CatalogSeedCategory[];
  subcategorias: CatalogSeedSubcategoria[];
};

const DEFAULT_SEED_FILENAME = 'seed-categorias-subcategorias.json';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// The seed file lives at the monorepo root. Resolve an explicit path, fall back to
// SEED_FILE_PATH, then walk up from cwd to locate the default file (works when the
// CLI is run from the backend workspace). Reading the file requires a concrete path.
function resolveSeedPath(filePath?: string): string {
  const explicit = filePath ?? process.env.SEED_FILE_PATH;
  if (explicit) {
    return isAbsolute(explicit) ? explicit : resolve(process.cwd(), explicit);
  }
  let dir = process.cwd();
  for (let level = 0; level < 6; level += 1) {
    const candidate = join(dir, DEFAULT_SEED_FILENAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(process.cwd(), DEFAULT_SEED_FILENAME);
}

function requireNonEmptyString(container: Record<string, unknown>, path: string, field: string): string {
  const value = container[field];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${path}.${field} is required and must be a non-empty string`);
  }
  return value;
}

function resolveSlug(raw: Record<string, unknown>, fallback: string): string {
  return typeof raw.slug === 'string' && raw.slug.trim() !== '' ? raw.slug : slugify(fallback);
}

function parseCategory(key: string, raw: unknown): CatalogSeedCategory {
  if (!isRecord(raw)) {
    throw new Error(`categorias["${key}"] must be an object`);
  }
  const path = `categorias["${key}"]`;
  const nombre = requireNonEmptyString(raw, path, 'nombre');
  const slug = resolveSlug(raw, nombre);
  return {
    id: slug,
    nombre,
    slug,
    orden: typeof raw.orden === 'number' ? raw.orden : 0,
    activa: typeof raw.activa === 'boolean' ? raw.activa : true,
    esDefault: raw.esDefault === true,
  };
}

function parseSubcategoria(
  key: string,
  raw: unknown,
  categoriaIds: Set<string>,
): CatalogSeedSubcategoria {
  if (!isRecord(raw)) {
    throw new Error(`subcategorias["${key}"] must be an object`);
  }
  const path = `subcategorias["${key}"]`;
  const categoriaId = requireNonEmptyString(raw, path, 'categoriaId');
  if (!categoriaIds.has(categoriaId)) {
    throw new Error(`${path}.categoriaId "${categoriaId}" does not match any category in the seed`);
  }
  const nombre = requireNonEmptyString(raw, path, 'nombre');
  const slug = resolveSlug(raw, nombre);
  return {
    id: `${categoriaId}--${slug}`,
    categoriaId,
    nombre,
    slug,
    orden: typeof raw.orden === 'number' ? raw.orden : 0,
    activa: typeof raw.activa === 'boolean' ? raw.activa : true,
  };
}

export function loadCatalogSeed(filePath?: string): CatalogSeed {
  const resolved = resolveSeedPath(filePath);
  let rawText: string;
  try {
    rawText = readFileSync(resolved, 'utf-8');
  } catch (err) {
    throw new Error(`Could not read seed file at "${resolved}": ${(err as Error).message}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error(`Seed file "${resolved}" is not valid JSON: ${(err as Error).message}`);
  }
  if (!isRecord(parsed)) {
    throw new Error(`Seed file "${resolved}" must contain a JSON object`);
  }
  const categoriasRaw = parsed.categorias;
  const subcategoriasRaw = parsed.subcategorias;
  if (!isRecord(categoriasRaw)) {
    throw new Error(`Seed file "${resolved}": "categorias" must be an object keyed by slug`);
  }
  if (!isRecord(subcategoriasRaw)) {
    throw new Error(`Seed file "${resolved}": "subcategorias" must be an object keyed by slug`);
  }
  const categorias = Object.entries(categoriasRaw).map(([key, value]) => parseCategory(key, value));
  const categoriaIds = new Set(categorias.map((c) => c.id));
  const subcategorias = Object.entries(subcategoriasRaw).map(([key, value]) =>
    parseSubcategoria(key, value, categoriaIds),
  );
  return { categorias, subcategorias };
}
