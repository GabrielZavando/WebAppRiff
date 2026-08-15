## 1. Bootstrap configuration (pure, testable)

- [x] 1.1 Write failing test for `loadBootstrapConfig`: valid email/name/password returns config; missing email throws; missing password throws; password <6 chars throws; name defaults to email local-part when absent
- [x] 1.2 Implement `apps/backend/src/usuarios/application/bootstrap-config.ts` with `loadBootstrapConfig(env)` (reads `BOOTSTRAP_SUPERADMIN_EMAIL/PASSWORD/NAME`, validates, returns `{ email, password, nombre }`)

## 2. Bootstrap superadmin use case

- [x] 2.1 Write failing test for `BootstrapSuperadminUseCase` (mock `IUsuarioRepository`): no users -> calls `create` with `rol:'superadmin'` and `creadoPor:'system'`, returns user
- [x] 2.2 Add failing test: email already exists (findAll returns match) -> does NOT call `create`, returns existing user (idempotent)
- [x] 2.3 Add failing test: `create` throws `auth/email-already-exists` -> resolves uid, calls `setRoleClaim` + `update` to repair claim/doc
- [x] 2.4 Implement `apps/backend/src/usuarios/application/bootstrap-superadmin.use-case.ts` injecting `I_USUARIO_REPOSITORY`

## 3. GET /auth/me endpoint

- [x] 3.1 Write failing test for `AuthController.me` (mock `IUsuarioRepository`): valid token uid -> 200 with `Usuario`; `findById` returns null -> 404 (401 already covered by FirebaseAuthGuard tests)
- [x] 3.2 Create `apps/backend/src/usuarios/infrastructure/auth.controller.ts` (`@Controller('auth')`, `@UseGuards(FirebaseAuthGuard)`, `@Get('me')`) injecting `I_USUARIO_REPOSITORY`
- [x] 3.3 Register `AuthController` and `BootstrapSuperadminUseCase` provider in `apps/backend/src/usuarios/usuarios.module.ts`

## 4. CLI entrypoint and npm script

- [x] 4.1 Create `apps/backend/src/cli/bootstrap-superadmin.ts` using `NestFactory.createApplicationContext([ConfigModule.forRoot({isGlobal:true}), FirebaseModule, FirestoreModule, UsuariosModule])`, resolving `BootstrapSuperadminUseCase` and running it with config from `loadBootstrapConfig(process.env)`
- [x] 4.2 Add `"bootstrap:superadmin": "nest build && node dist/cli/bootstrap-superadmin.js"` script to `apps/backend/package.json`
- [x] 4.3 Add a lightweight test that runs the use case + `loadBootstrapConfig` within a `Test.createTestingModule` with a mocked `IUsuarioRepository` (no real Firebase)

## 5. Documentation and API contract

- [x] 5.1 Add `GET /api/v1/auth/me` to `docs/api-spec.yml` (security bearerAuth, 200 -> Usuario, 401, 404)
- [x] 5.2 Document `BOOTSTRAP_SUPERADMIN_EMAIL`, `BOOTSTRAP_SUPERADMIN_PASSWORD`, optional `BOOTSTRAP_SUPERADMIN_NAME` in root `.env.example` and `apps/backend/.env.example`
- [x] 5.3 Document the bootstrap step in `apps/backend/README.md` (prerequisite: at least one superadmin before using `/users`)

## 6. Verification

- [x] 6.1 Run `npm run lint` and `npm run typecheck` in `apps/backend` (no errors)
- [x] 6.2 Run `npm test` in `apps/backend` (all green, coverage >= 90%)
- [x] 6.3 Run `npm run test:smoke` (backend) still passing
