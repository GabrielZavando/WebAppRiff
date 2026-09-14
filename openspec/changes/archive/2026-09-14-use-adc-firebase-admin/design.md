# Design — use-adc-firebase-admin

## Contexto

El backend inicializa Firebase Admin en `apps/backend/src/infrastructure/firebase/firebase.module.ts`
mediante un `useFactory` que construye un `ServiceAccount` explícito desde tres
variables de entorno (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY`) con `cert()` (via `buildServiceAccountFromEnv()`).

Con la infraestructura de staging provisionada (service account de runtime
`riff-api-runtime` en Cloud Run, WIF en CI), esta credencial explícita es
innecesaria en runtime: **Application Default Credentials (ADC)**
(`applicationDefault()`) resuelve la identidad en Cloud Run sin secretos.

## Decisión

1. **`firebase.module.ts`** inicializa con:
   ```ts
   credential: applicationDefault(),
   projectId: config.getOrThrow<string>('FIREBASE_PROJECT_ID'),
   storageBucket: config.getOrThrow<string>('FIREBASE_STORAGE_BUCKET'),
   ```
   Conservando el patrón singleton: si `getApps().length > 0`, devolver
   `getApp()` sin reinicializar. `FIREBASE_AUTH` provider inalterado.

2. **`storageBucket` pasa a ser requerido en runtime** (antes era omitido, y el
   CLI de migración leía el bucket aparte). Esto es correcto porque:
   - El backend de producción necesita el bucket por defecto en `getStorage(app)`.
   - `migrate:productos:imagenes` sigue resiliente: lee `FIREBASE_STORAGE_BUCKET`
     explícito con su propio fail-fast (scenario ya cubierto en su change).
   - Valor real: `webappriff.firebasestorage.app` (prod) /
     `riff-catalogo-staging.firebasestorage.app` (staging).

3. **`firebase.config.ts`**: se decide en el change (Task 3) entre mantener solo
   `normalizePrivateKey` (consumido por `cli/migrate/firebase-migration.adapter.ts`)
   o conservar ambos exports con `buildServiceAccountFromEnv` deprecated. La
   opción recomendada es **(a)**: `normalizePrivateKey()` permanece; el builder
   huérfano (y su suite) se elimina si el grep lo confirma.

## Archivos afectados

- `apps/backend/src/infrastructure/firebase/firebase.module.ts` (refactor)
- `apps/backend/src/infrastructure/firebase/firebase.module.spec.ts` (RED)
- `apps/backend/src/infrastructure/firebase/firebase.config.ts` (+ spec) según Task 3
- `.env.example` (raíz), `apps/backend/.env.example` (contrato)
- `docs/deploy-standards.md` (tabla de env)

## Desarrollo local

Tras el change, correr el backend local requiere ADC:
`gcloud auth application-default login` o `GOOGLE_APPLICATION_CREDENTIALS=<path>`
apuntando a una service account con acceso al proyecto. Documentado en
`.env.example` (Task 4).

## Testing

- Unit (mock `firebase-admin/app`): SC-001/002/003/004.
- Test de infra (`firebase-infra.spec.ts`): intacto (no depende de credenciales).
- `test:e2e` con Firestore fake in-memory: intacto.
- Cobertura ≥ 90 % intacta (umbrall de CI).
