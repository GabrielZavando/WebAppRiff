## Context

`backend-scaffold` (archivado) dejó un backend NestJS runnable: `src/main.ts` (bootstrap), `AppModule` con `AppController`/`AppService` (`GET /health`), configs TS/Jest/ESLint/dependency-cruiser, Dockerfile multi-stage y `.env.example` mínimo (solo `PORT=3000`). `firebase-admin` v12.7.0 y `@nestjs/config` v3 ya están declarados en `apps/backend/package.json` e instalados (hoisted en el `node_modules` raíz). No hay integración Firebase: el `AppModule` no importa `ConfigModule` ni inicializa `firebase-admin`.

El modelo de datos (`docs/data-model.md`) define 5 colecciones Firestore (`productos`, `categorias`, `subcategorias`, `usuarios`, `cotizaciones`) y `docs/backend-standards.md` establece que las reglas de integridad se implementan en NestJS (no en Firestore, que es schemaless). Para que `backend-categorias` (siguiente change) pueda persistir, necesita una instancia `Firestore` inyectada. La estructura Clean Architecture del estándar obliga a que `domain/` y `application/` NO importen `firebase-admin`: la integración Firebase es **infraestructura**, y el `Firestore` se inyecta vía token desde `infrastructure/`.

El `.env.example` raíz es el del template Specboot (PostgreSQL, `JWT_SECRET`, S3, Resend, Sentry) — desalineado con el stack real. `docs/deploy-standards.md` ya documenta las variables correctas (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `NESTJS_API_URL`, `ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL`).

Pendiente con el cliente (auditoría): confirmar si ya existe proyecto Firebase (Firestore habilitado) y obtener el service account JSON. Este change no bloquea por ello: el código y los tests no requieren credenciales reales (se mockea `firebase-admin`); solo el humo manual contra Firestore real las necesitará.

## Goals / Non-Goals

**Goals:**
- `ConfigModule` global (`@nestjs/config`) leyendo variables de entorno de forma tipada vía `ConfigService`.
- `FirebaseModule` `@Global` que inicializa la app de `firebase-admin` (singleton) desde un service account construido con `buildServiceAccountFromEnv`, exponiendo el token `FIREBASE_APP`.
- `FirestoreModule` `@Global` que provee el token `FIRESTORE` con la instancia `Firestore` (`getFirestore(app)`), listo para inyectar en repositories de dominio.
- Lógica pura y testeable en `firebase.config.ts`: `normalizePrivateKey` (convierte `\n` escapados a saltos reales) y `buildServiceAccountFromEnv` (mapea `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` a un `ServiceAccount`).
- Fail-fast: si falta alguna credencial Firebase, el arranque falla con un error descriptivo (no arranca a medias).
- Tests unitarios con `firebase-admin` mockeado (jest.mock), sin credenciales reales.
- `.env.example` raíz y `apps/backend/.env.example` alineados con el stack real (eliminar Postgres/JWT/S3; añadir `FIREBASE_*` + URLs de apps).
- `README.md` del backend con pasos de setup Firebase.

**Non-Goals:**
- NO se crean módulos de dominio (categorias/subcategorias/productos/usuarios/cotizaciones).
- NO verificación de JWT/Auth, ni Guards, ni Custom Claims (entra en `backend-commons` / `backend-usuarios`).
- NO Storage (Firebase Storage) — entra en `backend-productos` (galería + ficha técnica).
- NO `/health` enriquecido que reporte conectividad Firestore — el `/health` actual (`{"status":"ok"}`) no cambia; el health rico con `@nestjs/terminus` entra en `backend-commons`.
- NO se crean índices Firestore ni colecciones ni seeds — el seed de `sin-categoria` entra en `backend-categorias`.
- NO se toca `docs/api-spec.yml` ni `docs/data-model.md`.

## Decisions

1. **`@nestjs/config` + `ConfigService` tipado.** Se introduce `ConfigModule.forRoot({ isGlobal: true })` en `AppModule`. Alternativa considerada: leer `process.env` directamente sin `ConfigModule` — descartada porque el estándar del proyecto ya declara `@nestjs/config` como dependencia y `ConfigService` permite validación tipada + centralizada (y el guard de fail-fast queda en el provider factory, no disperso en `process.env`).

2. **Estructura bajo `src/infrastructure/firebase/` (no un módulo de dominio).** Firebase es infraestructura compartida transversal, no una entidad de negocio. La carpeta `infrastructure/` del estándar aloja "repositories con Firebase Admin SDK, controllers, adapters HTTP". Alternativa considerada: `src/common/firebase/` — descartada, `infrastructure/` es el término canónico del estándar y mantiene la coherencia con la regla DIP (nada de `domain/`/`application/` importa `firebase-admin`).

3. **Inyección por tokens (`FIREBASE_APP`, `FIRESTORE`), no clases concretas.** Los módulos de dominio inyectarán `@Inject(FIRESTORE) firestore: Firestore` en sus repositories. Alternativa considerada: exportar `Firestore` como provider de clase directa — descartada, porque `Firestore` se obtiene vía factory (`getFirestore(app)`) y el token permite inyectar el singleton sin acoplar al constructor de `firebase-admin`.

4. **`FirebaseModule` y `FirestoreModule` `@Global()`.** Así los módulos de dominio no necesitan re-importar Firebase en cada `imports`. Alternativa considerada: módulos no-globales importados explícitamente en cada feature — descartada, más verboso y propenso a olvidos; el estándar NestJS recomienda módulos globales para infraestructura transversal.

5. **`normalizePrivateKey` es una función pura dedicada.** El JSON de service account de Firebase escapa los saltos como `\n`; al pasarlo por variable de entorno, Node recibe el string literal `"\\n"` que debe convertirse a `\n` real o `firebase-admin` falla con "Invalid PEM". Regla: si el valor contiene `\\n` (barra+n), se reemplaza por `\n`; si ya viene con saltos reales, se deja intacto. Alternativa considerada: `.replace(/\\n/g, '\n')` inline en el factory — descartada porque la lógica merece test propio (casos: `\n` escapado, ya-normalizado, ausente) y es SRP.

6. **`buildServiceAccountFromEnv` como función pura + fail-fast.** Toma `{ projectId, clientEmail, privateKey }` (string|undefined) y devuelve `ServiceAccount`, lanzando `Error` descriptivo si falta `projectId`, `clientEmail` o `privateKey`. El provider factory de `FirebaseModule` la invoca con los valores de `ConfigService`. Alternativa considerada: validar con `class-validator`/joi en `ConfigModule` — descartada por sobredimensionar; una validación manual con mensajes claros basta para 3 variables y es más testeable sin añadir deps.

7. **Singleton de `firebase-admin` sin duplicar `initializeApp`.** El provider factory usa `getApps().length === 0 ? initializeApp(...) : getApp()` para no lanzar si el módulo se re-inicializa (p. ej., tests o hot-reload). Alternativa considerada: `initializeApp` directo — descartada, lanza en el segundo import.

8. **Tests con `jest.mock('firebase-admin/...')`, sin credenciales reales.** Se mockean `initializeApp`/`getApp`/`getApps` (de `firebase-admin/app`) y `getFirestore` (de `firebase-admin/firestore`). Los tests de `firebase.config.ts` son puros (sin mocks). Esto cumple `docs/backend-standards.md` § Testing ("mocks solo para servicios externos"). La verificación real contra Firestore (crear/doc leer/borrar en un proyecto de pruebas) queda documentada como paso manual post-apply, no como test automatizado en CI (requiere credenciales).

9. **`.env.example` raíz reescrito al stack real; `apps/backend/.env.example` extendido.** El raíz pasa a ser la referencia canónica del proyecto (Firebase + URLs de apps + deploy + logging), eliminando Postgres/JWT/S3/Resend/Sentry. El del backend lista las variables que el backend lee (`PORT`, `FIREBASE_*`). Alternativa considerada: un único `.env.example` — descartada, el monorepo necesita el raíz como canon y el de cada app como copia operativa (mismo patrón que `apps/web/.env.example`).

10. **`README.md` del backend documenta los pasos de Firebase Console** (crear proyecto → habilitar Firestore → generar service account → descargar JSON → mapear los 3 campos a las variables de entorno). Se incluye el aviso de no commitear el JSON. Alternativa considerada: crear un `docs/firebase-setup.md` aparte — descartada, el README del backend es el onboarding natural y el estándar pide "setup en 3 pasos".

11. **No añadir dependencias nuevas.** `@nestjs/config` y `firebase-admin` ya están declarados e instalados. No se añade `@nestjs/terminus`, `class-validator` para env, ni `firebase-functions`. Mantiene el `package.json` del backend intacto.

## Risks / Trade-offs

- **Risk**: no hay proyecto Firebase confirmado con el cliente; si no existe, el backend no arranca en local con credenciales reales. → **Mitigation**: el design documenta los pasos de Firebase Console; los tests no dependen de credenciales; el smoke real es un paso manual documentado. El cambio no se bloquea en planning.
- **Risk**: `FIREBASE_PRIVATE_KEY` mal normalizado (saltos escapados) causa "Invalid PEM" al inicializar. → **Mitigation**: `normalizePrivateKey` dedicada con tests de los 3 casos (escapado, normalizado, ausente); documentado en `.env.example`.
- **Risk**: `initializeApp` duplicado en tests/hot-reload lanza error de singleton. → **Mitigation**: guard `getApps().length === 0` en el factory (decisión 7); test del factory cubre el camino "app ya existe".
- **Risk**: `@Global()` de Firebase facilita el acoplamiento accidental de `domain/` a `firebase-admin` si un dev inyecta `Firestore` fuera de `infrastructure/`. → **Mitigation**: la regla DIP `no-infra-from-domain` de `.dependency-cruiser.js` (ya copiada en `backend-scaffold`) lo detecta mecánicamente cuando existan carpetas `domain/`/`application/`; el token `FIRESTORE` solo debe inyectarse en repositories de `infrastructure/`.
- **Trade-off**: validar env con código manual (`buildServiceAccountFromEnv`) vs `class-validator`/joi → simplicidad y testeabilidad para 3 variables; se puede migrar a un schema de validación más rico en `backend-commons` si crece el número de variables.
- **Trade-off**: no extender `/health` ahora → mantiene el cambio enfocado; el health de Firestore entra en `backend-commons` (con `@nestjs/terminus`).

## Migration Plan

- No hay migración de datos. Se añade código de infraestructura y config; el comportamiento de `/health` es invariante.
- Deploy: este change no se deploya solo (no aporta endpoint nuevo). El primer deploy con valor real es `backend-categorias` cuando exista un endpoint de dominio.
- Rollback: revertir el commit — `AppModule` vuelve a no importar `ConfigModule`/`FirebaseModule`/`FirestoreModule` y el backend sigue arrancando con `/health` (el código de dominio aún no existe, así que no hay dependencia rota).
- El `.env.example` raíz reescrito es retrocompatible para el sitio Astro (`apps/web/.env` sigue teniendo sus propias variables, no depende del raíz).

## Open Questions

- ¿El proyecto Firebase ya existe y cuál es el `FIREBASE_PROJECT_ID`? (pendiente confirmación con el cliente — no bloquea planning/apply con mocks; solo el smoke real.)
- ¿Se desea ubicación Firestore específica (región)? `firebase-admin` la ignora para Firestore (la región se fija al crear el proyecto en Console); no requiere config adicional.
- ¿Incluir un `.env.local` real (fuera de git) con credenciales en el entorno de desarrollo del equipo? El estándar manda no commitear credenciales; se asume que cada dev genera su propio `.env` a partir del `.env.example`.
