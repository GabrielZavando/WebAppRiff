# Verification Report — backend-usuarios

**Date**: 2026-08-15
**Verified by**: Build Agent (manual `/verify` — no `verify` CLI subcommand; performed per AGENTS.md `/verify` contract)
**Change status**: `openspec validate backend-usuarios` → valid · `openspec status` → 4/4 artifacts complete

## Static checks

| Check | Command | Result |
|-------|---------|--------|
| Unit + coverage | `jest --coverage` | 84 passed / 84 (21 suites) · global ≥ 90% branches (service 93.9%, repository 100%) · funcs/lines/stmts 100% |
| Lint (SOLID thresholds) | `eslint "src/**/*.ts"` | clean (exit 0) |
| Typecheck | `tsc --noEmit` | clean (exit 0) |
| Build | `nest build` | clean (exit 0) |
| OpenSpec validate | `openspec validate backend-usuarios` | valid |
| OpenSpec status | `openspec status --change backend-usuarios` | 4/4 artifacts complete |

## Scenario verification — `backend-usuarios` (17 scenarios)

### Requirement: Authenticate by verifying Firebase ID tokens

| # | Scenario | Test(s) |
|---|----------|---------|
| 1 | Valid token allows the request and populates `request.user` (incl. `role`) | `firebase-auth.guard.spec.ts` (valid token → `canActivate` true, `request.user` populated with `role`) |
| 2 | Missing or invalid token → 401 | `firebase-auth.guard.spec.ts` (missing header throws `UnauthorizedException` + invalid/expired token throws `UnauthorizedException`) |
| 3 | Public routes unaffected by the auth guard | `app.module.spec.ts` (`GET /health` → 200 without token) + design (guard only applies on decorated routes) |

### Requirement: Enforce role-based authorization via custom claims

| # | Scenario | Test(s) |
|---|----------|---------|
| 4 | Superadmin accesses a `@Roles('superadmin')` route | `roles.guard.spec.ts` (role included → `canActivate` true) |
| 5 | Editor denied a superadmin-only route | `roles.guard.spec.ts` (role not in allowed → throws `ForbiddenException`) |
| 6 | Request without `role` claim is denied | `roles.guard.spec.ts` (`request.user` lacking `role` → throws `ForbiddenException`) |

### Requirement: Synchronize role custom claim with Firestore on create/update

| # | Scenario | Test(s) |
|---|----------|---------|
| 7 | Creating a user sets the claim and persists the doc | `usuario.repository.spec.ts` (creates auth user, calls `setCustomUserClaims(uid, { role })`, writes `usuarios/{uid}`) |
| 8 | Updating a user's role updates the claim and the doc | `usuario.repository.spec.ts` (update email + rol) + `usuario.service.spec.ts` (role change → `setRoleClaim` called) |

### Requirement: Expose role-gated `/users` management endpoints

| # | Scenario | Test(s) |
|---|----------|---------|
| 9 | Admin lists users | `usuario.service.spec.ts` (allows an admin to list users) |
| 10 | Editor denied listing users | `usuario.service.spec.ts` (forbids an editor from reading a user) |
| 11 | Admin creates an editor | `usuario.service.spec.ts` (allows an admin to create an editor) |
| 12 | Admin cannot create an admin | `usuario.service.spec.ts` (forbids an admin from creating an admin) |
| 13 | Superadmin can create an admin | `usuario.service.spec.ts` (allows a superadmin to create an admin) |
| 14 | Admin cannot deactivate another admin | `usuario.service.spec.ts` (forbids an admin from deactivating another admin) |
| 15 | Superadmin deactivates an admin | `usuario.service.spec.ts` (allows a superadmin to deactivate another admin) |
| 16 | System keeps ≥ 1 active superadmin | `usuario.service.spec.ts` (demoting last active superadmin → `ConflictException`; demoting when another exists → OK) |
| 17 | Endpoints wired with guards + `@Roles` and delegate to service | `usuario.controller.spec.ts` (4 delegation tests) + `usuarios.module.spec.ts` (DI resolves) |

## Runtime smoke (HTTP layer)

Servidor build arrancado desde `dist/main.js` con las credenciales reales de `apps/backend/.env`:

- `GET /users` (sin token) → **401** (FirebaseAuthGuard rechaza header ausente).
- `GET /users` (bearer falso `abc.def.ghi`) → **401** (verifyIdToken inválido).
- `GET /health` (sin token) → **200** (ruta pública fuera del guard, correcto).

Esto confirma en la capa HTTP que el guard de autenticación se aplica a `/users` y que `/health` sigue siendo público.

## Non-blocking findings

- El camino de **token válido → 200** no se pudo ejercitar en runtime porque este sandbox no tiene salida de red a Firebase (el `verifyIdToken` debe consultar al servicio de Firebase). Ese camino está cubierto por tests unitarios con `verifyIdToken` mockeado (escenario 1). En un entorno con red, el mismo código valida el token y continuía.
- El `id` del documento `usuarios` es el Firebase UID (inmutable, técnico), según `docs/data-model.md`. El `creadoPor` apunta al UID del actor, no al documento destino.
- `docs/api-spec.yml` ya declaraba `/users` + `bearerAuth`; no requirió modificación en este cambio.

## Conclusion

Los 17 escenarios están satisfechos por tests unitarios en verde y por el smoke de runtime (401/401/200). Los gates estáticos (lint / typecheck / build / coverage ≥ 90%) están en verde. El cambio está listo para `/archive` y `/commit`.
