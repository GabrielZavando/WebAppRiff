## Why

El módulo `backend-usuarios` ya implementa autenticación (FirebaseAuthGuard/RolesGuard), el CRUD de `/users` y la sincronización del custom claim `role`. Pero `UsuarioService.create` exige un `actorRol` de superadmin ya autenticado, por lo que **no existe forma de crear el primer superadmin** (problema del huevo y la gallina). El `design.md` archivado de `backend-usuarios` dejó exactamente esta decisión como Open Question. Además, el futuro panel admin necesitará conocer el rol del usuario tras iniciar sesión y hoy no existe `GET /auth/me`.

## What Changes

- Nuevo entrypoint standalone NestJS (`apps/backend/src/cli/bootstrap-superadmin.ts`) ejecutable vía `npm run bootstrap:superadmin`, que crea el primer `superadmin` **sin actor autenticado**, leyendo credenciales desde variables de entorno.
- Nuevo use case `BootstrapSuperadminUseCase` (`usuarios/application`) que reusa `IUsuarioRepository.create` (Firebase Auth + custom claim `role` + Firestore) con lógica idempotente y `creadoPor: 'system'`.
- Nueva función pura y testeable `loadBootstrapConfig(env)` que valida las variables de entorno del bootstrap.
- Nuevo `AuthController` (`usuarios/infrastructure`) exponiendo `GET /api/v1/auth/me`, protegido solo por `FirebaseAuthGuard`, que devuelve el perfil `Usuario` del token verificado.
- Registro de `AuthController` y del use case en `UsuariosModule`.
- Script npm `bootstrap:superadmin` y documentación de variables `BOOTSTRAP_SUPERADMIN_*`.
- `docs/api-spec.yml`: se agrega `GET /api/v1/auth/me`.

## Capabilities

### New Capabilities

<!-- Ninguna nueva: el cambio extiende la capability existente backend-usuarios. -->

### Modified Capabilities

- `backend-usuarios`: se añaden (a) un comando CLI para el bootstrap del primer superadmin (idempotente, sin actor) y (b) `GET /api/v1/auth/me` para que el panel admin conozca el perfil/rol del usuario autenticado.

## Impact

- **Código afectado**: nuevo `apps/backend/src/cli/bootstrap-superadmin.ts`; nuevo use case + config en `apps/backend/src/usuarios/application`; nuevo `apps/backend/src/usuarios/infrastructure/auth.controller.ts`; ajustes en `apps/backend/src/usuarios/usuarios.module.ts` y `apps/backend/package.json`.
- **API / contratos**: se AGREGA `GET /api/v1/auth/me` en `docs/api-spec.yml`; no cambia `/users`.
- **Dependencias**: cero nuevas — Firebase Admin SDK ya presente; el CLI usa `NestFactory.createApplicationContext` (parte de `@nestjs/core`).
- **Variables de entorno**: nuevas `BOOTSTRAP_SUPERADMIN_EMAIL`, `BOOTSTRAP_SUPERADMIN_PASSWORD`, opcional `BOOTSTRAP_SUPERADMIN_NAME` (documentadas en `.env.example`).
- **Riesgo**: exponer la password en env del deploy → **Mitigation**: el CLI no la loguea y el bootstrap es idempotente (re-run seguro). Riesgo: duplicar superadmin → **Mitigation**: precheck por email + catch de `auth/email-already-exists`.
