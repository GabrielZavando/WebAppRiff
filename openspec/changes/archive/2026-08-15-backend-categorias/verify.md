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

## Runtime smoke (PASSED — 2026-08-15)

GCP Firestore API enabled and database created in project `web-app-riff`. Server boots,
`onModuleInit` seeds `sin-categoria`, and the public categories endpoint returns the envelope:

```
$ PORT=3010 node dist/main.js &
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/health
200
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/api/v1/categories
200
$ curl -s http://localhost:3010/api/v1/categories
{"data":[{"id":"sin-categoria","nombre":"Sin categoría","slug":"sin-categoria",
  "orden":0,"activa":true,"esDefault":true, ...}],"error":null,
  "meta":{"timestamp":"2026-08-15T14:09:17.933Z","path":"/api/v1/categories"}}
$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3010/categories
404
```

- `GET /health` → 200 (root, excluded from prefix)
- `GET /api/v1/categories` → 200 with envelope `{ data: [ sin-categoria ] }` — seed confirmed in Firestore
- `GET /categories` (no prefix) → 404 — confirms global `/api/v1` prefix is applied

No IAM change was required: the `FIREBASE_CLIENT_EMAIL` service account already had
Firestore access. The earlier `PERMISSION_DENIED` was solely the disabled Cloud Firestore API.

## Manual verification notes
- Editor role: `PUT/PATCH /api/v1/categories/:id` allowed; `POST`/`DELETE` → 403 (covered by controller spec assertions on `@Roles` metadata).
- `sin-categoria` seed is idempotent and protected from deletion via `esDefault` + fixed id (covered by service + repository specs).
