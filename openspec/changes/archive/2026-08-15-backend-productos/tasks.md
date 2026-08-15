# Tasks: backend-productos

## G1 — Domain & contracts (TDD red→green)
- [ ] G1.1 Create `Producto` entity + `ProductoInput` / `ProductoUpdateInput` / `ProductoFilter` types in `domain/producto.entity.ts` (pure types; add a unit test for the `slugify` helper extracted to `application/slugify.ts`)
- [ ] G1.2 Define ports `IProductRepository`, `IProductQueryRepository`, `IProductIntegrityRepository` + injection tokens in `domain/iproducto.repository.ts` (interfaces only; no test)
- [ ] G1.3 Implement `ProductoCreateDto` (class-validator) + spec: required `sku`/`titulo`/`categoriaId`; `galeria` ≤10 when present; `fichaTecnica` shape; RED→GREEN
- [ ] G1.4 Implement `ProductoUpdateDto` (`PartialType`) + spec: all fields optional; `galeria` ≤10 and `fichaTecnica` shape validated when present; RED→GREEN

## G2 — Application services (TDD red→green)
- [ ] G2.1 Implement `ProductoConsistencyService` (default `sin-categoria`; `existsById` on categoria; `belongsToCategoria` on subcategoria) + spec with both integrity ports mocked
- [ ] G2.2 Implement `ProductoReadService` (`findAll` with filters + anonymous published-forcing; `findById`; `findBySlug`) + spec (mock `IProductQueryRepository`)
- [ ] G2.3 Implement `ProductoWriteService` (`create`/`update`/`remove` + all business rules; `slugify` auto-gen) + spec (mocks repos + consistency service)

## G3 — Repositories (TDD red→green)
- [ ] G3.1 Implement `ProductoRepository` (create/findById/update/remove/findAll/findBySlug) + spec with Firestore Admin SDK mocked
- [ ] G3.2 Implement `ProductoIntegrityRepository` (existsBySku/existsBySlug with `excludeId`) + spec with Firestore Admin SDK mocked

## G4 — Controller, module, cross-cutting
- [ ] G4.1 Add `OptionalFirebaseAuthGuard` to `AuthModule` (verifies token if present, attaches `req.user`, does not reject anonymous) and export it
- [ ] G4.2 Implement `ProductoController` (routes incl. `/slug/:slug` before `/:id`; optional auth on GET; role guards on writes; envelope) + spec (role metadata + delegation + anonymous-published behavior)
- [ ] G4.3 Update `SubcategoriasModule` to `exports` of `I_SUBCATEGORIA_REPOSITORY` + `I_SUBCATEGORIA_INTEGRITY_REPOSITORY`
- [ ] G4.4 Implement `ProductosModule` (providers + controllers + imports `AuthModule`, `FirebaseModule`, `CategoriasModule`, `SubcategoriasModule`) + import in `AppModule` + module spec
- [ ] G4.5 Update `docs/api-spec.yml` `/api/v1/products` entries (list, by id, by slug, create, update, delete) with roles and published behavior

## G5 — Validation
- [ ] G5.1 Run `npm run lint` + `npm run build`; full `npx jest --coverage` ≥90% branches; `openspec validate backend-productos` + `status`
