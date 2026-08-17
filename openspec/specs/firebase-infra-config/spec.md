# firebase-infra-config Specification

## Purpose
Define las reglas de seguridad Firestore (lockdown de cliente) y la configuración de
índices como código versionado en el repo (`apps/backend/firebase.json`,
`apps/backend/firestore.rules`, `apps/backend/firestore.indexes.json`). Todo el acceso
a datos es vía el backend con Admin SDK, por lo que los clientes (web/admin SDKs) deben
estar totalmente bloqueados. No se requieren índices compuestos (los repos usan filtros
de igualdad + sort en memoria).

## Requirements

### Requirement: Client access lockdown via versioned rules
The project SHALL define Firestore security rules as code in the repository and deploy
them, denying all client-side read/write access because all data access is performed by
the backend using the Admin SDK.

#### Scenario: Rules deny client access
- **WHEN** the `firestore.rules` are deployed to the destination project
- **THEN** any client (non-Admin-SDK) read or write request is denied

#### Scenario: Rules are versioned in the repo
- **WHEN** a developer inspects the repository
- **THEN** a `firestore.rules` file exists defining the lockdown and is referenced by `firebase.json`

### Requirement: Firestore index configuration defined as code
The project SHALL define Firestore index configuration as code in `firestore.indexes.json`.
Because the backend repositories use equality-only filters (`==`) with sorting and text
search resolved in memory (see `ProductoRepository.findAll`), no composite indexes are
required. The file therefore declares an empty index set and relies on Firestore's
automatic single-field indexes.

#### Scenario: Indexes configuration is valid and deployed
- **WHEN** the `firestore.indexes.json` is deployed
- **THEN** it is valid JSON and the product/subcategoria equality-only queries execute without a missing-index error

#### Scenario: Indexes are versioned in the repo
- **WHEN** a developer inspects the repository
- **THEN** a `firestore.indexes.json` file exists and is referenced by `firebase.json`
