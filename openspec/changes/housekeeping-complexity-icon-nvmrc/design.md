# Design: Housekeeping técnico — complejidad ciclomática + warning astro-icon + .nvmrc

## Context

- `apps/web/eslint.config.mjs` fija `complexity: ['warn', 10]`. La pasada actual
  de `npm run lint --workspace=apps/web` emite exactamente 2 warnings:
  - `buildProductsPageHref` (apps/web/src/lib/products/buildProductsPageHref.ts:24):
    complejidad **13**.
  - `parseProductsPageFilters` (apps/web/src/lib/products/parseProductsPageFilters.ts:16):
    complejidad **12**.
- Ambas funciones son helpers puros con tests unitarios completos
  (`apps/web/src/lib/products/__tests__/`) que cubren el comportamiento
  observable (defaults, normalización de valores inválidos, encoding, etc.).
- astro-icon **1.2.0** (`node_modules/astro-icon/dist/vite-plugin-astro-icon.js`)
  acepta `iconDir?: string` (default `"src/icons"`, ver `typings/integration.d.ts`),
  pero el plugin de Vite llama **siempre** a `loadLocalCollection(iconDir)` →
  `importDirectory()` de `@iconify/tools`, que lanza `ENOENT` si la carpeta no
  existe; el `catch` del plugin emite
  `Failed to load icons from "<iconDir>"`. Verificado empíricamente con
  `@iconify/tools` instalado: una ruta inexistente lanza `ENOENT`; una carpeta
  vacía existente carga una colección local vacía (`{"prefix":"local","icons":{}}
  `) **sin ningún warning**.
- `.nvmrc` ya existe en la raíz con contenido `24` (una línea + salto final,
  commit `a6e2f42` "chore(deps): align monorepo versions — Node 24, ...").
  `engines.node` ya pide `>=24.0.0` y no se toca.
- Restricciones del flujo: TDD, sin dependencias nuevas, sin cambiar firmas
  públicas exportadas, tests existentes intactos.

## Goals / Non-Goals

**Goals:**

- Llevar ambas funciones a complejidad **≤10** manteniendo comportamiento
  idéntico (tests sin modificar como criterio de verdad).
- Eliminar el warning de astro-icon del build de `apps/web`.
- Dejar verificado el estado del ítem `.nvmrc` (ya resuelto en el repo).
- Un solo commit con todo el housekeeping.

**Non-Goals:**

- No subir el umbral de ESLint ni añadir supresiones: los números objetivo se
  alcanzan por refactor real.
- No unificar el patrón duplicado de parsing de enteros positivos detectado en
  `apps/web/src/lib/config/products.ts:11` (misma expresión que
  `parsePositiveInt`); se señala como candidata a future housekeeping, fuera de
  alcance aquí para mantener el diff mínimo.
- No introducir iconos locales ni modificar `astro.config.mjs`.
- No tocar `engines.node`, `package.json` ni dependencias.

## Decisions

### D1 — `buildProductsPageHref`: extraer helper privado de construcción de query

Partir el único export en dos: la función pública normaliza defaults (los 5
`??`) y delega en un helper privado `buildProductsPageQuery(...)` (no exportado)
que concentra los condicionales de `URLSearchParams`.

- Complejidad resultante: pública **7** (5 `??` + ternario final + base),
  helper **6** (5 condicionales + base). Ambas ≤10.
- Alternativa considerada: lookup tables / early returns dentro de la misma
  función — no reducen los puntos de decisión reales sin partir la función;
  extraer el helper es el corte natural (normalización vs. serialización).
- El helper queda privado: no cambia la superficie pública ni requiere tests
  nuevos.

### D2 — `parseProductsPageFilters`: extraer dos helpers privados de parsing

- `parseTrimmedText(params: URLSearchParams, key: string): string` →
  `(params.get(key) ?? '').trim()`; reemplaza el parsing de `q` y
  `categoriaId`. Complejidad 2.
- `parsePositiveInt(raw: string | null, fallback: number): number` →
  `Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback`;
  reemplaza el parsing de `page` y `pageSize`. Complejidad 3. Mismas señales
  semánticas que hoy: `Number(null)` = 0 → fallback (param ausente), `NaN` →
  fallback (basura), `floor` para decimales.
- Complejidad de la función principal: **5** (base + ternarios de
  `view`/`sortBy`/`sortDir` que quedan inline: 1 + 2 + 1). Los arrow functions
  de `map`/`filter` de `subcategoriaIds` se miden por separado (complejidad 1).
- Alternativa considerada y descartada: un helper genérico
  `parseEnumParam<T>(raw, allowed, fallback)` para `view`/`sortBy`/`sortDir`.
  Bajaría la principal a 1 pero añade un genérico con casts y más churn para un
  problema ya resuelto con margen; se prefiere el diff mínimo.

### D3 — astro-icon: crear `src/icons/` vacía (Opción B); descartar `iconDir` a ruta inexistente (Opción A)

- **Opción A descartada con evidencia**: cualquier `iconDir` apuntando a una
  ruta inexistente produce el mismo warning (el plugin siempre intenta
  `importDirectory` y el `ENOENT` cae en el `catch` → `logger.warn`). No hay
  flag para desactivar la colección local en astro-icon 1.2.0.
- **Decisión**: crear `apps/web/src/icons/` con `.gitkeep` y un `README.md`
  mínimo (que aclare: "no hay iconos locales; todo viene de iconify"). Con la
  carpeta vacía existente, el build pasa de warning a info:
  `Loaded icons from src/icons, lucide, simple-icons`.
- `astro.config.mjs` queda **sin cambios**: el default `iconDir = "src/icons"`
  ya apunta a la carpeta creada; configurarlo explícitamente sería un no-op.

### D4 — `.nvmrc`: sin cambios, solo verificación

El archivo ya existe con el contenido exacto pedido (`24`). El plan lo verifica
(`cat .nvmrc` == `24`) y documenta el hallazgo en el reporte final.

### D5 — Estrategia de verificación y entrega

- Rama `chore/housekeeping-complexity-icon-nvmrc` desde `main`; un solo commit
  con los 3 ítems.
- Gate de verificación (en orden): `npm run lint` (0 warnings de complejidad),
  `npm run build --workspace=apps/web` (sin warning de astro-icon),
  `npm test --workspace=apps/web` (verde con tests intactos),
  `npm run typecheck`, `make ci` completo y
  `npx openspec validate --all --strict` (73/73).

## Risks / Trade-offs

- [El refactor de `parsePositiveInt` cambia sutilmente el tratamiento de
  `null`/ausente] → Mitigación: `Number(null)` = 0 reproduce el comportamiento
  actual; los tests existentes cubren ausente, `'0'`, negativos, basura y
  decimales para `page` y `pageSize`; se ejecutan sin modificarlos.
- [La carpeta `src/icons/` vacía podría interpretarse como "aquí van iconos
  locales"] → Mitigación: el README dentro de la carpeta lo contradice
  explícitamente; si el equipo quiere la carpeta en `.gitignore` más adelante,
  es un cambio de una línea fuera de alcance.
- [`logCollections` emite `No icons detected!` si alguna vez todas las
  colecciones quedan vacías] → No aplica hoy (lucide + simple-icons siempre
  presentes); se documenta como comportamiento conocido del plugin.
- [Complejidad del helper de query crezca con futuros params] → El corte
  normalización/serialización deja margen (6/10); si un día supera 10, se
  particiona de nuevo por param en vez de subir el umbral.

## Migration Plan

Sin migración: no hay datos, ni API pública, ni despliegue condicionado al
cambio (el build de Cloud Run/Coolify simplemente deja de emitir el warning).
Rollback = revertir el único commit.

## Open Questions

Ninguno. La única ambigüedad del pedido original (qué vía usar para astro-icon)
se resolvió con evidencia del código fuente del paquete: Opción B.
