## 1. FirebaseAuthGuard (TDD)

- [x] 1.1 Crear `apps/backend/src/auth/firebase-auth.guard.ts` con `export class FirebaseAuthGuard implements CanActivate` que inyecta `FIREBASE_AUTH` y expone `canActivate(context)` leyendo `Authorization: Bearer <token>` de la request, verificándolo con `getAuth(app).verifyIdToken(token)` y asignando `request.user = decodedToken`.
- [x] 1.2 Escribir `apps/backend/src/auth/firebase-auth.guard.spec.ts` que falle primero (clase no existe). Verificar RED.
- [x] 1.3 Test: token válido → `canActivate` devuelve `true` y `request.user` queda poblado con el claim `role`.
- [x] 1.4 Test: header ausente → `canActivate` lanza `UnauthorizedException` (401).
- [x] 1.5 Test: token inválido/expirado (verifyIdToken rechaza) → `canActivate` lanza `UnauthorizedException`.
- [x] 1.6 Implementar el guard. Verificar GREEN.

## 2. RolesGuard + @Roles decorator (TDD)

- [x] 2.1 Crear `apps/backend/src/auth/roles.decorator.ts` con `export const Roles = (...roles: string[]) => SetMetadata('roles', roles)` y `apps/backend/src/auth/roles.guard.ts` con `export class RolesGuard implements CanActivate` que usa `Reflector` para leer los metadatos `roles` y compara con `request.user.role`.
- [x] 2.2 Escribir `apps/backend/src/auth/roles.guard.spec.ts` que falle primero. Verificar RED.
- [x] 2.3 Test: `request.user.role` está en los roles permitidos → `canActivate` devuelve `true`.
- [x] 2.4 Test: `request.user.role` NO está en los roles permitidos → lanza `ForbiddenException` (403).
- [x] 2.5 Test: `request.user` sin claim `role` → lanza `ForbiddenException`.
- [x] 2.6 Test: handler sin metadata de roles (ruta pública detrás del guard) → `canActivate` devuelve `true` (no restringe).
- [x] 2.7 Implementar decorator + guard. Verificar GREEN.

## 3. FIREBASE_AUTH token + AuthModule

- [x] 3.1 En `apps/backend/src/infrastructure/firebase/firebase.module.ts` añadir el provider `FIREBASE_AUTH` (`getAuth(app)`) junto a `FIRESTORE`, y exportar los tokens.
- [x] 3.2 Crear `apps/backend/src/auth/auth.module.ts` (`@Module`) que provee y **exporta** `FirebaseAuthGuard`, `RolesGuard` y el decorador `@Roles` (para que módulos de dominio los reutilicen).
- [x] 3.3 Test (integration ligero): `AuthModule` compila y los guards son resolvibles.

## 4. Usuario entity, repository port y DTOs (TDD)

- [x] 4.1 Crear `apps/backend/src/usuarios/domain/usuario.entity.ts` con `export interface Usuario { id: string; nombre: string; email: string; rol: 'superadmin' | 'admin' | 'editor'; activo: boolean; creadoPor: string; creadoEn: Date; actualizadoEn: Date }`.
- [x] 4.2 Crear `apps/backend/src/usuarios/domain/iusuario.repository.ts` con `export interface IUsuarioRepository` (≤5 métodos: `create`, `findAll`, `findById`, `update`, `setRoleClaim`).
- [x] 4.3 Crear `apps/backend/src/usuarios/infrastructure/usuario-create.dto.ts` (`nombre`, `email` (email), `rol` (enum admin|editor), `password?` (min 6)) y `usuario-update.dto.ts` (`nombre?`, `email?` (email), `rol?` (enum), `activo?`) con `class-validator`.
- [x] 4.4 Escribir `apps/backend/src/usuarios/infrastructure/usuario-create.dto.spec.ts` y `usuario-update.dto.spec.ts` que fallen primero. Verificar RED.
- [x] 4.5 Test: `UsuarioCreateDto` con `rol: 'superadmin'` es inválido (solo admin/editor en alta); `rol: 'editor'` es válido; `email` mal formado inválido.
- [x] 4.6 Test: `UsuarioUpdateDto` acepta subset de campos; `rol: 'superadmin'` permitido en modificación.
- [x] 4.7 Implementar DTOs. Verificar GREEN.

## 5. UsuarioService — reglas de rol + sync de claim (TDD)

- [x] 5.1 Crear `apps/backend/src/usuarios/application/usuario.service.ts` con `create(dto, actorRol, actorUid)`, `findAll(actorRol)`, `findById(id, actorRol)`, `update(id, dto, actorRol)` que aplican las reglas de `docs/data-model.md` y delegan en `IUsuarioRepository` (inyectado por token).
- [x] 5.2 Escribir `apps/backend/src/usuarios/application/usuario.service.spec.ts` que falle primero. Verificar RED.
- [x] 5.3 Test: `admin` crea `editor` → OK; `admin` crea `admin` → `ForbiddenException`.
- [x] 5.4 Test: `superadmin` crea `admin`/`editor` → OK; `superadmin` crea `superadmin` → OK.
- [x] 5.5 Test: `editor` lista/lee usuarios → `ForbiddenException`.
- [x] 5.6 Test: `admin` desactiva otro `admin` → `ForbiddenException`; `superadmin` desactiva otro `admin` → OK.
- [x] 5.7 Test: desactivar/demoter el último `superadmin` activo → `ConflictException` (409).
- [x] 5.8 Test: crear/actualizar delega en repository incluyendo `setRoleClaim` con el `rol` correcto.
- [x] 5.9 Implementar el service. Verificar GREEN.

## 6. UsuarioRepository — Firebase Auth + Firestore (TDD, firebase-admin mockeado)

- [x] 6.1 Crear `apps/backend/src/usuarios/infrastructure/usuario.repository.ts` que implementa `IUsuarioRepository` usando Firebase Admin SDK (`auth().createUser`, `auth().setCustomUserClaims`) y Firestore (`collection('usuarios')`), respetando DIP (no importa `firebase-admin` en domain/application).
- [x] 6.2 Escribir `apps/backend/src/usuarios/infrastructure/usuario.repository.spec.ts` con `firebase-admin/auth` y `firebase-admin/firestore` mockeados. Verificar RED.
- [x] 6.3 Test: `create` llama `createUser`, `setCustomUserClaims(uid, { role })`, y escribe `usuarios/{uid}`.
- [x] 6.4 Test: `update` con cambio de `rol` llama `setCustomUserClaims` con el nuevo rol y actualiza el doc.
- [x] 6.5 Test: `findAll`/`findById` leen de Firestore y mapean a `Usuario`.
- [x] 6.6 Implementar el repository. Verificar GREEN.

## 7. UsuarioController — /users CRUD con guards (TDD)

- [x] 7.1 Crear `apps/backend/src/usuarios/infrastructure/usuario.controller.ts` con `@Controller('users')` y endpoints `GET` ( `@Roles('superadmin','admin')` ), `POST` ( `@Roles('superadmin','admin')` ), `GET /:id`, `PUT /:id`, `PATCH /:id` (todos con `@UseGuards(FirebaseAuthGuard, RolesGuard)`). El service recibe el `rol` del token vía `@Request()`.
- [x] 7.2 Escribir `apps/backend/src/usuarios/infrastructure/usuario.controller.spec.ts` que falle primero. Verificar RED.
- [x] 7.3 Test: `GET /users` con token `admin` → 200; con token `editor` → 403.
- [x] 7.4 Test: `POST /users` con `admin` creando `editor` → 201; creando `admin` → 403.
- [x] 7.5 Test: `PUT /:id` deactivando otro `admin` con token `admin` → 403; con `superadmin` → 200.
- [x] 7.6 Implementar el controller. Verificar GREEN.

## 8. Wiring

- [x] 8.1 Crear `apps/backend/src/usuarios/usuarios.module.ts` (`@Module`) que importa `AuthModule`, declara controller + providers (`UsuarioService`, `{ provide: IUsuarioRepository, useClass: UsuarioRepository }`).
- [x] 8.2 Importar `AuthModule` y `UsuariosModule` en `apps/backend/src/app.module.ts`.
- [x] 8.3 `npm run typecheck` y `npm run build` → exit 0.

## 9. Validation & SDD

- [x] 9.1 `npm run lint` → exit 0.
- [x] 9.2 `npm test -- --coverage` → all pass, coverage ≥ 90% (branches incluidas).
- [x] 9.3 `openspec validate backend-usuarios` → valid.
- [x] 9.4 `openspec status --change backend-usuarios` → 4/4 artefactos completos.
- [x] 9.5 Adversarial review (lente Architect/SOLID) sobre `src/auth/**` y `src/usuarios/**`.
