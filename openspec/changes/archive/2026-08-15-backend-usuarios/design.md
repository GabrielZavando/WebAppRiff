## Context

`backend-scaffold`, `backend-firebase-config` y `backend-commons` (archivados) entregaron un BFF NestJS runnable con Firebase configurado (tokens `FIREBASE_APP`/`FIRESTORE`, `@Global`), CORS, validación global, Throttler (omitindo `/health`), sobre de respuesta `{ data, error, meta }` para `/api/v1/**`, filtro de excepciones y `/health` enriquecido. Sin embargo, `docs/api-spec.yml` declara `bearerAuth` (Firebase JWT + custom claims `role`) y define `/users` CRUD, pero **ningún endpoint está protegido**: no hay verificación de token ni autorización por roles.

El `docs/data-model.md` define la entidad `usuarios` (id = UID de Firebase Auth, `rol: superadmin|admin|editor`, `activo`, `creadoPor`, trazabilidad) y reglas de negocio estrictas: Superadmin gestiona todo + otros usuarios; Admin CRUD catálogo + crea editors; Editor CRUD catálogo; un admin no puede desactivarse a sí mismo ni a otro admin; nunca puede quedar sin al menos un superadmin activo. El rol vive en Firestore como fuente de verdad y se sincroniza como Custom Claim; la autorización por request lee el claim del token (sin consultar Firestore).

Se reordena el roadmap: `backend-usuarios` (Auth) ahora precede a `backend-categorias`, porque las escrituras de catálogo necesitan auth.

## Goals / Non-Goals

**Goals:**

- `FirebaseAuthGuard` que verifica el ID token Firebase (`getAuth(app).verifyIdToken`) y puebla `request.user` (401 si falta/inválido/expirado).
- `@Roles(...)` + `RolesGuard` que lee el claim `role` y responde 403 si no aplica; el auth guard corre antes que el roles guard.
- `AuthModule` que exporta guards + decorador para que los módulos de dominio (categorías, productos, etc.) los reutilicen.
- Entidad `Usuario`, puerto `IUsuarioRepository`, `UsuarioService` (reglas de rol + sincronización de custom claim), `UsuarioRepository` (Firebase Auth Admin + Firestore), `UsuarioController` (`/users` CRUD con guards).
- Sincronización del custom claim `role` en alta y modificación de usuario.
- DTOs `UsuarioCreateDto` / `UsuarioUpdateDto` con `class-validator`.
- `FIREBASE_AUTH` token en `FirebaseModule` para inyección limpia (sin importar `firebase-admin` en capas altas).
- Tests unitarios (TDD) para guards, service (reglas), DTOs y repository (firebase-admin mockeado).

**Non-Goals:**

- NO se implementan escrituras de `categorias`/`subcategorias`/`productos`/`cotizaciones` — entran en changes posteriores que reutilizarán `AuthModule`.
- NO se implementa login/logout: Firebase Auth maneja la autenticación del lado del cliente; el backend solo verifica el token.
- NO se añade `@nestjs/passport` ni `passport-firebase` — se verifica el token directo con Admin SDK (cero deps nuevas).
- NO se toca `docs/api-spec.yml` en esta fase (los contratos ya existen).

## Decisions

1. **Verificación de token directa con Admin SDK, sin Passport.** `FirebaseAuthGuard implements CanActivate` inyecta `FIREBASE_AUTH` y llama `verifyIdToken`. Alternativa Passport → descartada (dependencia nueva, innecesaria para un solo proveedor).

2. **`request.user` = token decodificado.** El guard guarda el `DecodedIdToken` en `request.user`; el `RolesGuard` lee `request.user.role`. Esto evita consultar Firestore por request (cumple el estándar de auth por claims).

3. **`@Roles(...)` vía `SetMetadata('roles', roles)`.** Decorador puro en `application/auth`; el `RolesGuard` lee los metadatos con `Reflector`. Patrón estándar Nest, testeable.

4. **Orden de guards: `[@UseGuards(FirebaseAuthGuard, RolesGuard)]`.** Nest ejecuta en orden; el auth puebla `request.user` antes de que el roles guard lo lea. Si no hay auth, el roles guard ni siquiera corre (ya dio 401).

5. **`AuthModule` exporta guards + decorador.** Los módulos de dominio (`UsuariosModule`, y luego categorías/productos) importan `AuthModule` y aplican `@UseGuards(AuthGuard, RolesGuard)` + `@Roles(...)` en sus controllers. Evita duplicar la lógica de auth.

6. **Custom claim `role` como fuente de verdad en request; Firestore como fuente de verdad persistida.** Al crear/actualizar usuario, el service llama al repository que hace `setCustomUserClaims(uid, { role })` y escribe el doc `usuarios/{uid}`. Los cambios de rol actualizan ambos.

7. **Creación de usuario = `auth().createUser` + claim + doc.** El repository usa Firebase Auth Admin para `createUser({ email, password })` → UID → `setCustomUserClaims` → `firestore.collection('usuarios').doc(uid).set(...)`. El id del documento es el UID (no autogenerado).

8. **Reglas de rol como lógica de dominio en `UsuarioService`.** El service recibe el `actorRole` (del token del solicitante) y valida: admin solo crea editor; superadmin crea admin/editor; admin no desactiva self/otro admin; nunca <1 superadmin activo → 409. Alternativa: validar en controller → descartada (rompe SRP y dificulta testear).

9. **`FIREBASE_AUTH` token nuevo.** Se añade en `firebase.module.ts` al lado de `FIRESTORE`, usando `getAuth(app)`. Las capas `domain`/`application` solo conocen el token/tipo, nunca `firebase-admin` directo.

10. **Cero dependencias nuevas.** Firebase Admin SDK ya presente. Se respeta la decisión de no añadir deps.

## Risks / Trade-offs

- **Risk**: token expirado/revocado → 401 correcto. → **Mitigation**: `verifyIdToken` lanza; el guard mapea a 401. Test cubre token inválido.
- **Risk**: claim `role` ausente en token legacy → 403. → **Mitigation**: `RolesGuard` trata claim ausente como no autorizado.
- **Risk**: dejar sin superadmin activo. → **Mitigation**: `UsuarioService` cuenta superadmins activos antes de desactivar/demoter y responde 409.
- **Trade-off**: no hay endpoint `/auth/me`; el frontend puede decodificar el token client-side o llamar `GET /users/{uid}`. Se puede añadir después si se requiere.
- **Trade-off**: verificar token por request a Firebase añade latencia ~ms; aceptable y sin estado (no consulta Firestore).

## Migration Plan

- No hay migración de datos. Se crean usuarios bajo demanda vía `/users` (primer superadmin debe ser creado por un seed/admin inicial o por configuración del cliente).
- Deploy: este change habilita auth en las rutas que lo declaren; las rutas públicas (`/health`, futuras GET de catálogo) siguen libres. Compatible con `backend-commons`.
- Variables de entorno: ninguna nueva (reusa credenciales Firebase ya configuradas).
- Rollback: revertir commit — `UsuariosModule`/`AuthModule` dejan de importarse; las rutas vuelven a no requerir auth (estado previo a este change).

## Open Questions

- ¿El primer `superadmin` se crea vía un seed script aparte o lo da de alta el cliente manualmente en Firebase Console + doc Firestore? Por now se asume que existe al menos un superadmin inicial fuera de este change.
- ¿Se desea un endpoint `GET /auth/me` para que el panel admin conozca el rol del usuario actual? No está en `docs/api-spec.yml`; se puede añadir en un change de ajuste.
