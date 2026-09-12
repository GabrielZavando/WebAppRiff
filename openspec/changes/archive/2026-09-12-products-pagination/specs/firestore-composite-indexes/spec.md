## ADDED Requirements

### Requirement: Composite indexes for Firestore public product listing
The system SHALL declare composite indexes in `apps/backend/firestore.indexes.json` for the `productos` collection to support the native Firestore pagination path. Required indexes:
1. `publicado ASC, creadoEn DESC` (default listing)
2. `publicado ASC, categoriaId ASC, creadoEn DESC` (category filter)
3. `publicado ASC, subcategoriaId ASC, creadoEn DESC` (subcategory filter)
4. `publicado ASC, destacado ASC, creadoEn DESC` (featured filter)

Each index SHALL have `collectionGroup: "productos"` and the fields array in the correct order with appropriate ASC/DESC ordering.

#### Scenario: firestore.indexes.json contains required composite indexes
- **WHEN** the file `apps/backend/firestore.indexes.json` is inspected
- **THEN** it contains at least 4 index definitions under the `indexes` array
- **AND** each index has `collectionGroup: "productos"`
- **AND** each index has a `fields` array with the correct field names and orders

### Requirement: Data model documents composite indexes
The file `docs/data-model/data-model.md` SHALL include a section "Índices compuestos (Firestore)" documenting:
- The index matrix (filter combinations × sort)
- The use of `count()` aggregation for `meta.total`
- The tradeoff: offset facturas lecturas en páginas profundas; búsqueda/sort alternativo se resuelve en memoria

#### Scenario: data-model.md documents index matrix
- **WHEN** `docs/data-model/data-model.md` is read
- **THEN** it contains a section titled "Índices compuestos (Firestore)"
- **AND** the section lists at least the 4 required composite indexes
- **AND** the section documents `count()` usage for pagination total
- **AND** the section documents the offset tradeoff
