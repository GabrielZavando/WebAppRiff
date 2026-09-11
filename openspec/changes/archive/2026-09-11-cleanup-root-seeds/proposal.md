# Proposal — cleanup-root-seeds

**Ticket ID**: C3
**Original title**: cleanup-root-seeds
**Tag (source)**: backend (inferido de `Capas afectadas` del enriched ticket, confirmado)
**Derived change name**: cleanup-root-seeds
**Change folder**: `openspec/changes/cleanup-root-seeds/`
**Enriched artifact used**: yes (`openspec/tickets/C3-enriched.md`)

## Summary

Limpiar la raíz del monorepo eliminando residuos del framework (`.specboot-backup-*`, `dist/` vacío) y reposicionar los archivos JSON de seed del catálogo a un directorio dedicado `data/`.

## Motivation

AUDIT.md H1.1/M2/M6 identifica que la raíz acumula:

- 3 carpetas `.specboot-backup-*` (snapshots gitignored del framework, no del producto)
- `dist/` vacío y gitignored
- `seed-categorias-subcategorias.json` y `seed-productos-71.json` trackeados en la raíz sin directorio propio

El audit recomienda explícitamente "moverlos a `data/` o mantenerlos documentados". Mover a `data/` es la opción limpia: separa datos de producto del tooling del framework.

## Scope

- `git mv` de ambos seeds a `data/`
- Actualizar las 3 constantes `DEFAULT_SEED_FILENAME`/`DEFAULT_SEED_FILE_NAME` en los loaders backend
- Actualizar la ruta hardcodeada en el spec del loader de productos
- Actualizar `docs/seed-catalog.md` (referencias de default path)
- Borrar 3× `.specboot-backup-*` y `dist/` vacío
- **No se toca**: `.gitignore`, Makefile, frontend, API, data model

## Design Validation

- **Entities checked against data-model**: `productos`, `categorias`, `subcategorias` — existen en `docs/data-model/data-model.md`. Los seeds las poblan con IDs deterministas consistentes con el data model.
- **API endpoints checked against api-spec.yml**: none (este change no modifica endpoints)
- **Conflicts**: none
