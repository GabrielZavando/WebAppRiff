# backend-productos Specification — DELTA (backend-seed-productos)

> This delta adds a requirement to the existing `backend-productos` capability so the product repository can accept an explicit document id (needed by the seed CLI for deterministic ids). The public HTTP contract (DTOs/endpoints) is unchanged.

## ADDED Requirements

### Requirement: Repository create SHALL accept an optional explicit id without changing the public API
The backend-productos SHALL extend `ProductoInput` with an optional `id?: string`. The repository `create()` SHALL use the provided `id` (instead of auto-generating one) when present, and persist it as the Firestore document id. The HTTP DTOs (`ProductoCreateDto`/`ProductoUpdateDto`) SHALL remain unchanged so the public API contract is unaffected. The interface method count of `IProductRepository` SHALL remain ≤ 5 (ISP).

#### Scenario: Create with explicit id stores that exact id
- **WHEN** `repository.create({ ..., id: 'prod-001' })` is called
- **THEN** the stored document has id `prod-001`

#### Scenario: Create without id auto-generates an id
- **WHEN** `repository.create({ ... })` is called without `id`
- **THEN** the stored document has a non-empty auto-generated id
