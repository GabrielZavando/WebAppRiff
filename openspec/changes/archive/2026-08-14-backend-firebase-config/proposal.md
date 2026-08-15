## Why

El backend NestJS ya arranca (`backend-scaffold` archivado) pero no tiene integración con Firebase: no inicializa `firebase-admin`, no expone Firestore por inyección, y no hay configuración de entorno real. Todas las colecciones del dominio (`productos`, `categorias`, `subcategorias`, `usuarios`, `cotizaciones` en `docs/data-model.md`) viven en Firestore, y los módulos de dominio (empezando por `backend-categorias`) necesitan un `Firestore` inyectado para persistir. Además, el `.env.example` raíz está desalineado con el stack Riff: documenta PostgreSQL, JWT propio y S3 cuando el estándar (`docs/backend-standards.md`, `docs/deploy-standards.md`) es Firestore + Firebase Auth (Custom Claims) + Firebase Storage. Este change entrega la capa de infraestructura Firebase (inicialización + providers por token) y alinea la configuración de entorno, desbloqueando el primer módulo de datos real.

## What Changes

- `apps/backend`: introducir `ConfigModule` (`@nestjs/config`, ya declarado en `package.json`) como módulo global para leer variables de entorno de forma tipada.
- Crear `src/infrastructure/firebase/firebase.module.ts` (módulo `@Global`): inicializa la app de `firebase-admin` con un service account construido desde variables de entorno (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) y expone el token `FIREBASE_APP`. Falla rápido (error descriptivo) si falta alguna credencial.
- Crear `src/infrastructure/firebase/firestore.module.ts` (módulo `@Global`): provee el token `FIRESTORE` con la instancia `Firestore` (`getFirestore(app)`), reutilizable por los repositories de los módulos de dominio.
- Crear `src/infrastructure/firebase/firebase.tokens.ts` con las constantes de inyección `FIREBASE_APP` y `FIRESTORE`.
- Crear `src/infrastructure/firebase/firebase.config.ts` con lógica pura y testeable: `normalizePrivateKey` (normaliza `\n` escapados del JSON de service account) y `buildServiceAccountFromEnv` (mapea las 3 variables a un `ServiceAccount`).
- Reescribir `.env.example` raíz: eliminar variables stale (PostgreSQL, `JWT_SECRET` propio, S3, Resend, Sentry) y declarar las reales del stack Riff (`FIREBASE_*`, `NESTJS_API_URL`, `ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL`, deploy y logging).
- Extender `apps/backend/.env.example` con las variables Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) y nota de que CORS/Throttler entran en `backend-commons`.
- Actualizar `apps/backend/README.md` con los pasos de setup Firebase (crear proyecto en Firebase Console, habilitar Firestore, descargar service account JSON y mapearlo a las variables de entorno).
- Tests unitarios con `firebase-admin` mockeado (conforme a `docs/backend-standards.md` § Testing: mocks solo para servicios externos): lógica pura de configuración + wiring de los módulos.
- **No se crean módulos de dominio** (categorias, productos, etc.) — entran en changes posteriores.
- **No se incluye** verificación de Auth JWT/Guards (entra en `backend-commons`/`backend-usuarios`), ni Storage (entra en `backend-productos`), ni `/health` enriquecido (entra en `backend-commons`).

## Capabilities

### New Capabilities
- `backend-firebase`: integración de `firebase-admin` con el backend NestJS — inicialización de la app Firebase desde variables de entorno, provisión de `Firestore` por inyección de tokens, lógica pura de configuración del service account (normalización de la private key) y alineación de la configuración de entorno del proyecto con el stack Firestore/Firebase Auth/Firebase Storage.

### Modified Capabilities
- `backend-runtime`: se extiende la configuración de entorno del backend — el `.env.example` del backend (`apps/backend/.env.example`) y el raíz (`.env.example`) pasan a documentar las variables Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) y las URLs de las apps (`NESTJS_API_URL`, `ASTRO_SITE_URL`, `ANGULAR_ADMIN_URL`), reemplazando las variables stale (PostgreSQL, JWT propio, S3) del template original. El endpoint `/health` y el bootstrap de `backend-runtime` NO cambian de comportamiento.

## Impact

- **Código afectado**: `apps/backend/src/` (nuevos archivos bajo `infrastructure/firebase/`), `apps/backend/src/app.module.ts` (importa `ConfigModule` + `FirebaseModule` + `FirestoreModule`), `apps/backend/.env.example`, `.env.example` raíz, `apps/backend/README.md`.
- **API / contratos**: sin cambios a `docs/api-spec.yml` ni `docs/data-model.md`. Este change no añade endpoints; `/health` sigue devolviendo `{"status":"ok"}`.
- **Dependencias**: `@nestjs/config` ya está declarado en `apps/backend/package.json` (v3) y `firebase-admin` v12 instalado. Cero dependencias nuevas (cumple la decisión "no añadir deps").
- **Configuración**: se introduce la convención de variables de entorno Firebase. `FIREBASE_PRIVATE_KEY` se normaliza (los `\n` escapados del JSON de service account se convierten a saltos reales) para evitar el error clásico de Firebase en Node.
- **Fallback / fail-fast**: si faltan credenciales Firebase, el arranque del backend falla con un error descriptivo (no arranca a medias). En los tests unitarios se mockea `firebase-admin`, no se requieren credenciales reales.
- **Riesgo**: no hay proyecto Firebase confirmado con el cliente (decisión "no estoy seguro" en auditoría). → Mitigación: el design documenta los pasos exactos de Firebase Console (crear proyecto, habilitar Firestore, descargar service account). Los specs y el código no dependen de credenciales reales (tests mockeados); el `/apply` real (humo contra Firestore) requerirá el service account.
- **Riesgo**: `initializeApp` de `firebase-admin` es singleton por proceso; si se importa dos veces lanza error. → Mitigation: `FirebaseModule` es `@Global` y se importa una única vez desde `AppModule`; el provider factory usa `getApps().length` para no duplicar (o delega en el singleton por defecto).
