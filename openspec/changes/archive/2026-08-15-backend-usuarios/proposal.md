## Why

El BFF ya declara `bearerAuth` (Firebase JWT + custom claims) en `docs/api-spec.yml` y los endpoints `/users` están especificados, pero nada verifica tokens ni aplica roles: hoy cualquier ruta protegida es accesible sin autenticación. El roadmap original difería Auth a `backend-usuarios` (último), pero las escrituras de catálogo (categorías, productos, etc.) requieren auth. Por decisión del usuario se reordena: entregar Auth primero para desbloquear las escrituras de dominio.

## What Changes

- `apps/backend/src/auth/firebase-auth.guard.ts`: guard que verifica el ID token Firebase y puebla `request.user` (401 si falta/inválido).
- `apps/backend/src/auth/roles.guard.ts` + `roles.decorator.ts`: `@Roles(...)` + guard que lee el claim `role` y responde 403 si no aplica.
- `apps/backend/src/auth/auth.module.ts`: exporta guards/decorator para reutilización por módulos de dominio.
- `apps/backend/src/usuarios/domain/usuario.entity.ts` + `iusuario.repository.ts`: entidad y puerto.
- `apps/backend/src/usuarios/application/usuario.service.ts`: reglas de rol + sincronización de custom claim.
- `apps/backend/src/usuarios/infrastructure/usuario.repository.ts`: Firestore + Firebase Auth Admin (`createUser`, `setCustomUserClaims`).
- `apps/backend/src/usuarios/infrastructure/usuario.controller.ts` + DTOs: `/users` CRUD con guards y `@Roles`.
- `apps/backend/src/infrastructure/firebase/firebase.module.ts`: añade token `FIREBASE_AUTH` para inyección limpia.
- `apps/backend/src/app.module.ts`: importa `AuthModule` y `UsuariosModule`.
- Tests unitarios (TDD) para guards, service (reglas de rol), DTOs y repository (con `firebase-admin` mockeado).

## Capabilities

### New Capabilities

- `backend-usuarios`: autenticación vía verificación de ID token Firebase (`FirebaseAuthGuard` → 401 si falta/inválido), autorización por roles vía custom claims (`@Roles` + `RolesGuard` → 403), sincronización del claim `role` con Firestore en alta/modificación de usuario, y CRUD de `/users` con control de acceso por roles y las reglas de negocio de usuarios del `docs/data-model.md`.

## Impact

- **Código afectado**: nuevos `apps/backend/src/auth/**` y `apps/backend/src/usuarios/**`; cambios en `apps/backend/src/app.module.ts` y `apps/backend/src/infrastructure/firebase/firebase.module.ts`.
- **API / contratos**: implementa contratos ya existentes en `docs/api-spec.yml` (`/users`, `bearerAuth`); sin cambios de contrato en esta fase.
- **Dependencias**: cero nuevas — Firebase Admin SDK ya presente; se verifica el token directamente con `getAuth().verifyIdToken(...)` (sin `@nestjs/passport`).
- **Riesgo**: token inválido/expirado o claim ausente → 401/403 bien manejados. → **Mitigation**: tests del guard cubren los caminos.
- **Riesgo**: dejar el sistema sin superadmin activo. → **Mitigation**: regla de negocio 409 en el service.
