## Context

`backend-usuarios` (archivado) entrega auth (FirebaseAuthGuard verifica el ID token y puebla `request.user` con el `DecodedIdToken`, que incluye `uid` y el custom claim `role`; RolesGuard lee el claim y responde 403) y el CRUD de `/users`. Toda creación/modificación de usuario — explícitamente superadmin — requiere un actor superadmin ya autenticado en `UsuarioService`. No hay superadmin inicial, así que el sistema está "cerrado": no se puede crear el primero. El `design.md` de `backend-usuarios` lo dejó como Open Question ("¿El primer superadmin se crea vía un seed script aparte...?").

`UsuarioRepository` (impl. de `IUsuarioRepository`, 5 métodos — cumple ISP) ya hace exactamente lo necesario en `create()`: `auth.createUser({email, password})` → `setCustomUserClaims(uid, {rol})` → escribe `usuarios/{uid}`. `FirebaseModule` y `FirestoreModule` son `@Global()` con tokens `FIREBASE_APP`/`FIREBASE_AUTH`/`FIRESTORE`. El interceptor global envuelve en `{ data, error, meta }` toda ruta bajo `/api/v1/`.

Este change abre la puerta con un comando CLI operativo (no expone endpoint público de bootstrap) y, además, añade `GET /auth/me` para el futuro login del panel admin.

## Goals / Non-Goals

**Goals:**

- Comando CLI idempotente que crea el primer `superadmin` reusando `IUsuarioRepository.create` (Firebase Auth + custom claim `role` + Firestore `usuarios/{uid}`).
- `GET /api/v1/auth/me` que devuelve el `Usuario` del token autenticado.
- Cero dependencias nuevas; respetar DIP/ISP/SRP y TDD (tests primero, red → green → refactor).

**Non-Goals:**

- NO construir el panel admin (frontend) — queda para otro change. El backend solo deja al usuario en Firebase Auth + Firestore con el claim, listo para que el frontend futuro haga `signInWithEmailAndPassword` y luego llame a `/auth/me`.
- NO exponer un endpoint HTTP de bootstrap (se eligió CLI por seguridad).
- NO modificar `UsuarioRepository` ni su interfaz (sigue en 5 métodos, ISP).

## Decisions

1. **CLI vía `NestFactory.createApplicationContext`.** Contexto mínimo:
   `[ConfigModule.forRoot({isGlobal:true}), FirebaseModule, FirestoreModule, UsuariosModule]`.
   No levanta servidor HTTP; reusa toda la DI existente (`FIREBASE_APP`/`FIREBASE_AUTH`/`FIRESTORE` son `@Global`). El `BootstrapSuperadminUseCase` se resuelve del contexto y se ejecuta. Alternativa (endpoint HTTP con token secreto) → descartada por superficie de ataque innecesaria.

2. **Use case dedicado `BootstrapSuperadminUseCase`** en `application/`, que inyecta `I_USUARIO_REPOSITORY` y llama `create({nombre, email, rol:'superadmin', password, creadoPor:'system'})`. Se salta `UsuarioService` a propósito: no hay actor. Alternativa (pasar `actorRol:'superadmin'` falso a `UsuarioService.create`) → descartada: confunde la trazabilidad de `creadoPor` y la semántica de rol.

3. **Idempotencia con precheck por email.** El use case hace `repository.findAll()` y filtra por email; si ya existe un usuario con ese email, NO crea y devuelve el existente. Si `create` lanza `auth/email-already-exists`, resuelve el uid con `getAuth().getUserByEmail`, asegura el claim (`setRoleClaim`) y el doc (`update`). Trade-off: el precheck hace list-scan; aceptable para un comando one-off sobre una colección pequeña (MVP). Se documenta.

4. **`creadoPor: 'system'`.** Constante literal: creado por el proceso de bootstrap, no por un usuario. Queda como valor fijo en el use case.

5. **`GET /auth/me` en `AuthController` dentro de `UsuariosModule`.** Se ubica en `usuarios/infrastructure/auth.controller.ts` (NO en `auth.module.ts`) para evitar dependencia circular (`UsuariosModule` ya importa `AuthModule`). Usa `@Controller('auth')` + `@UseGuards(FirebaseAuthGuard)` (sin `RolesGuard`: cualquier usuario autenticado). Lee `request.user.uid` y llama `IUsuarioRepository.findById(uid)`; devuelve `Usuario` (el interceptor global envuelve en `{data,error,meta}` porque la URL empieza por `/api/v1`). Si no hay doc → 404.

6. **Config pura y testeable.** `loadBootstrapConfig(env)` valida presencia de `BOOTSTRAP_SUPERADMIN_EMAIL` y `BOOTSTRAP_SUPERADMIN_PASSWORD` (>=6 chars) y deriva `nombre` de `BOOTSTRAP_SUPERADMIN_NAME` o del local-part del email. Lanza error descriptivo si falta. Separada del wiring Nest para TDD.

7. **Script npm.** `"bootstrap:superadmin": "nest build && node dist/cli/bootstrap-superadmin.js"`. No requiere `ts-node` (cero deps nuevas). Se documenta en README del backend.

## Risks / Trade-offs

- **Password en env de deploy** → el CLI NO la imprime en logs; el bootstrap es idempotente (re-run seguro).
- **List-scan en precheck** → one-off, colección pequeña; aceptable en MVP.
- **Estado partido (Auth user existe pero sin doc Firestore)** → el catch de `email-already-exists` lo repara (claim + doc). Cubierto por test.
- **Dependencia circular** → `AuthController` vive en `usuarios/infrastructure`, no en `auth.module.ts`.

## Migration Plan

- Sin migración de datos. Se ejecuta una vez tras deploy:
  `BOOTSTRAP_SUPERADMIN_EMAIL=... BOOTSTRAP_SUPERADMIN_PASSWORD=... npm run bootstrap:superadmin`.
- Variables nuevas en `.env`: `BOOTSTRAP_SUPERADMIN_EMAIL`, `BOOTSTRAP_SUPERADMIN_PASSWORD`, opcional `BOOTSTRAP_SUPERADMIN_NAME`. Documentadas en `.env.example` (raíz y `apps/backend`).
- Rollback: revertir commit; el CLI deja de existir y `/auth/me` desaparece (las rutas `/users` vuelven a requerir un superadmin ya existente).

## Open Questions

<!-- Resueltas por este change: el primer superadmin se crea vía CLI seed. /auth/me se incluye para el login futuro del panel. -->
