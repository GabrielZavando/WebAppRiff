# Scenarios — use-adc-firebase-admin

> Nota de validación de diseño: este change no introduce ni modifica entidades
> del data model (`productos`, `categorias`, `subcategorias`, `usuarios`,
> `cotizaciones` quedan intactas) ni endpoints del API. Solo cambia la forma de
> autenticar el Firebase Admin SDK en runtime.

### SC-001: Inicialización con ADC cuando no existe app previa

**Given** el backend arranca en un entorno sin apps Firebase inicializadas
**When** NestJS resuelve el provider `FIREBASE_APP` con `FIREBASE_PROJECT_ID` y `FIREBASE_STORAGE_BUCKET` configuradas
**Then** se invoca `initializeApp` una sola vez con credencial `applicationDefault()`, `projectId` igual a `FIREBASE_PROJECT_ID` y `storageBucket` igual a `FIREBASE_STORAGE_BUCKET`
**And** ni `FIREBASE_CLIENT_EMAIL` ni `FIREBASE_PRIVATE_KEY` son leídas ni requeridas en runtime

### SC-002: Reutilización de la app existente (singleton)

**Given** que ya existe al menos una app Firebase inicializada (hot-reload, segundo testing module)
**When** NestJS resuelve el provider `FIREBASE_APP`
**Then** se retorna `getApp()` sin invocar `initializeApp` nuevamente

### SC-003: Fail-fast sin FIREBASE_PROJECT_ID

**Given** la variable `FIREBASE_PROJECT_ID` no está definida
**When** NestJS intenta resolver el provider `FIREBASE_APP` sin apps previas
**Then** el arranque falla con un error descriptivo que menciona `FIREBASE_PROJECT_ID` (vía `ConfigService.getOrThrow`)

### SC-004: Fail-fast sin FIREBASE_STORAGE_BUCKET

**Given** `FIREBASE_PROJECT_ID` está definida pero `FIREBASE_STORAGE_BUCKET` no
**When** NestJS intenta resolver el provider `FIREBASE_APP` sin apps previas
**Then** el arranque falla con un error descriptivo que menciona `FIREBASE_STORAGE_BUCKET`

### SC-005: CLIs locales no se ven afectados

**Given** los comandos CLI (`migrate:firestore`, `migrate:productos:imagenes`, `bootstrap:superadmin`, seeds) que corren localmente fuera de Cloud Run
**When** se ejecutan con un service account explícito
**Then** siguen autenticando con `cert()` como hasta ahora, usando `normalizePrivateKey()` desde `firebase.config.ts`, que permanece disponible

### SC-006: Contrato de entorno actualizado

**Given** un desarrollador nuevo que configura su entorno local copiando `.env.example`
**When** lee `.env.example` (raíz y backend) y la tabla de variables de `docs/deploy-standards.md`
**Then** encuentra documentado que el runtime solo requiere `FIREBASE_PROJECT_ID` y `FIREBASE_STORAGE_BUCKET`
**And** que `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` son exclusivas de CLIs locales
**And** que en local el runtime usa `gcloud auth application-default login` (o `GOOGLE_APPLICATION_CREDENTIALS`)

### SC-007: Suite de tests sin credenciales reales

**Given** la suite completa del backend (`lint`, `typecheck`, `test`, `test:cov`, `test:e2e`)
**When** se ejecuta en CI sin credenciales Firebase reales
**Then** todos los checks pasan, incluyendo los specs actualizados del `FirebaseModule` que mockean `applicationDefault()`
