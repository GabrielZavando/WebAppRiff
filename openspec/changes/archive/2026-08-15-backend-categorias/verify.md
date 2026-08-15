# Verify — backend-categorias

Change: `backend-categorias` (Categories CRUD + `sin-categoria` seed + global `/api/v1` prefix)
Verification performed: 2026-08-15

## Automated verification (PASSED)

| Check | Command | Result |
|-------|---------|--------|
| Unit + integration tests | `npx jest src/categorias` | 45 passed, 6 suites |
| Full backend suite + coverage | `npx jest --coverage` | 129 passed, 27 suites; **99.13% stmts / 95.45% branches** (≥90%) |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Build | `npm run build` | exit 0 (nest build) |
| OpenSpec validation | `openspec validate backend-categorias` | valid |
| OpenSpec status | `openspec status --change backend-categorias` | 4/4 artifacts complete |

### Test breakdown (TDD)

- **G1 Entity/ports/DTOs**: entity + 2 ISP ports (`ICategoriaRepository`, `ICategoriaIntegrityRepository`) + `CategoriaCreateDto`/`CategoriaUpdateDto` (no `esDefault` editable) — 11 specs.
- **G2 CategoriaService**: business rules (`create` slug dup→409, `remove` default→409, `remove` with products→409, missing→404, `ensureDefault` idempotent) — 14 specs.
- **G3 CategoriaRepository**: Firestore (`categorias`) + `hasAssociatedProducts` via `productos.where('categoriaId','==',id).limit(1)`; firebase-admin mocked — 13 specs.
- **G4 CategoriaController**: `GET` public; `POST`/`DELETE` `@Roles('superadmin','admin')`; `PUT`/`PATCH` `@Roles('superadmin','admin','editor')`; route `/categories` (prefixed to `/api/v1/categories` by `main.ts`) — 6 specs.
- **G5 CategoriasModule + AppModule**: `onModuleInit→ensureDefault`; wiring — 1 spec.

## Runtime smoke (BLOCKED — environment, not code)

`GET /health` and the public `GET /api/v1/categories` could not be exercised end-to-end because the server crashes at boot inside `onModuleInit`:

```
Error: 7 PERMISSION_DENIED: Cloud Firestore API has not been used in project web-app-riff
before or it is disabled.
```

Root cause: the **Firestore API is not enabled in the GCP project `web-app-riff`** (account/infrastructure issue). This affects **any** DB-backed runtime call, not just categories. The boot log confirms correct routing:

- `Mapped {/health, GET}` (root, excluded from prefix)
- `Mapped {/api/v1/users, GET|POST}`, `{/api/v1/users/:id, GET|PUT}`
- `Mapped {/api/v1/categories, GET|POST}`, `{/api/v1/categories/:id, GET|PUT|DELETE}`

So the global `/api/v1` prefix + `health` exclusion and all route registrations are confirmed correct at the Nest routing layer; only the DB call inside `ensureDefault()` is blocked by GCP.

### Action required to complete runtime smoke
Enable the Cloud Firestore API for project `web-app-riff` (https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=web-app-riff), then re-run:
- `GET /health` → 200
- `GET /api/v1/categories` → 200 with envelope `{ data: [...] }`
- `GET /categories` (no prefix) → 404

## Manual verification notes
- Editor role: `PUT/PATCH /api/v1/categories/:id` allowed; `POST`/`DELETE` → 403 (covered by controller spec assertions on `@Roles` metadata).
- `sin-categoria` seed is idempotent and protected from deletion via `esDefault` + fixed id (covered by service + repository specs).
