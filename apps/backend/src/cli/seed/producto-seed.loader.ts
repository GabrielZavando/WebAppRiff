import { existsSync, readFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { slugify } from '@/common/utils/slugify';
import {
  Atributo,
  FichaTecnica,
  GaleriaItem,
  ProductoInput,
} from '@/productos/domain/producto.entity';

export type ProductoSeedItem = ProductoInput & { id: string };
export type ProductoSeed = { productos: ProductoSeedItem[] };

const DEFAULT_SEED_FILENAME = 'seed-productos-71.json';

// Productos del seed que son duplicados confirmados y deben excluirse del seed
// (colisionan en slug con otro producto ya sembrado). Decisión del cliente
// (post-validación en staging): excluir solo el duplicado real `prod-054`.
const SEED_PRODUCTOS_EXCLUIR: ReadonlySet<string> = new Set(['prod-054']);

// Overrides de slug para productos distintos que, por error del origen, comparten
// el mismo slug que otro producto. `prod-069` es un producto distinto (SKU
// `FLO-CLT-HIL`) pero venía con el mismo slug que `prod-068`.
const SEED_PRODUCTOS_SLUG_OVERRIDE: Readonly<Record<string, string>> = {
  'prod-069': 'medidor-cuenta-litros-flowtech-hil',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function requireNonEmptyString(container: Record<string, unknown>, path: string, field: string): string {
  const value = container[field];
  if (!isString(value) || value.trim() === '') {
    throw new Error(`${path}.${field} is required and must be a non-empty string`);
  }
  return value;
}

function requireNumber(container: Record<string, unknown>, path: string, field: string): number {
  const value = container[field];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${path}.${field} is required and must be a number`);
  }
  return value;
}

function requireBoolean(container: Record<string, unknown>, path: string, field: string): boolean {
  const value = container[field];
  if (typeof value !== 'boolean') {
    throw new Error(`${path}.${field} is required and must be a boolean`);
  }
  return value;
}

function optionalString(value: unknown, fallback = ''): string {
  return isString(value) && value.trim() !== '' ? value : fallback;
}

function optionalStringOrNull(value: unknown): string | null {
  return isString(value) && value.trim() !== '' ? value : null;
}

function parseAtributos(raw: unknown): Atributo[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) {
    throw new Error('atributos must be an array');
  }
  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`atributos[${index}] must be an object`);
    }
    return {
      nombre: requireNonEmptyString(item, `atributos[${index}]`, 'nombre'),
      valor: requireNonEmptyString(item, `atributos[${index}]`, 'valor'),
    };
  });
}

function parseStock(raw: unknown): { disponible: boolean; cantidad: number | null } {
  if (raw === undefined || raw === null) return { disponible: true, cantidad: null };
  if (!isRecord(raw)) throw new Error('stock must be an object');
  const disponible = raw.disponible === undefined ? true : requireBoolean(raw, 'stock', 'disponible');
  const cantidad =
    raw.cantidad === undefined || raw.cantidad === null
      ? null
      : requireNumber(raw, 'stock', 'cantidad');
  return { disponible, cantidad };
}

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

function parseProducto(key: string, raw: unknown): ProductoSeedItem {
  if (!isRecord(raw)) {
    throw new Error(`productos["${key}"] must be an object`);
  }
  const path = `productos["${key}"]`;
  const sku = requireNonEmptyString(raw, path, 'sku');
  const titulo = requireNonEmptyString(raw, path, 'titulo');

  const precio = raw.precio;
  if (!isRecord(precio)) {
    throw new Error(`${path}.precio is required and must be an object`);
  }
  const precioValor = requireNumber(precio, `${path}.precio`, 'valor');
  const precioVisible = requireBoolean(precio, `${path}.precio`, 'visible');

  // `precio.moneda` is intentionally dropped: the data model fixes CLP and the
  // field is not part of the domain entity nor the HTTP DTO.
  const input: ProductoInput = {
    sku,
    titulo,
    slug: optionalString(raw.slug, slugify(titulo)),
    categoriaId: optionalString(raw.categoriaId, 'sin-categoria'),
    subcategoriaId: optionalStringOrNull(raw.subcategoriaId),
    idExterno: optionalStringOrNull(raw.idExterno),
    descripcionBreve: optionalString(raw.descripcionBreve),
    descripcionLarga: optionalString(raw.descripcionLarga),
    atributos: parseAtributos(raw.atributos),
    precio: { valor: precioValor, visible: precioVisible },
    stock: parseStock(raw.stock),
    galeria: Array.isArray(raw.galeria) ? (raw.galeria as GaleriaItem[]) : [],
    fichaTecnica: isRecord(raw.fichaTecnica)
      ? (raw.fichaTecnica as unknown as FichaTecnica)
      : null,
    destacado: typeof raw.destacado === 'boolean' ? raw.destacado : false,
    publicado: typeof raw.publicado === 'boolean' ? raw.publicado : false,
  };

  return { id: key, ...input };
}

export function loadProductoSeed(filePath?: string): ProductoSeed {
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
  const productosRaw = parsed.productos;
  if (!isRecord(productosRaw)) {
    throw new Error(`Seed file "${resolved}": "productos" must be an object keyed by id`);
  }
  const productos = Object.entries(productosRaw)
    .filter(([id]) => !SEED_PRODUCTOS_EXCLUIR.has(id))
    .map(([k, v]) => parseProducto(k, v))
    .map((item) =>
      SEED_PRODUCTOS_SLUG_OVERRIDE[item.id]
        ? { ...item, slug: SEED_PRODUCTOS_SLUG_OVERRIDE[item.id] }
        : item,
    );
  return { productos };
}
