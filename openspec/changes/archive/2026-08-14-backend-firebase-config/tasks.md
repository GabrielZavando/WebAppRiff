## 1. Configuración pura (TDD)

- [x] 1.1 Crear `apps/backend/src/infrastructure/firebase/firebase.tokens.ts` con `export const FIREBASE_APP = 'FIREBASE_APP'` y `export const FIRESTORE = 'FIRESTORE'` (constantes de inyección, strings literales).
- [x] 1.2 Escribir `apps/backend/src/infrastructure/firebase/firebase.config.spec.ts` que falle primero: `normalizePrivateKey` y `buildServiceAccountFromEnv` no existen todavía. Verificar RED.
- [x] 1.3 Test: `normalizePrivateKey('-----BEGIN\\nKEY-----')` → `-----BEGIN\nKEY-----` (escapado a salto real).
- [x] 1.4 Test: `normalizePrivateKey('-----BEGIN\nKEY-----')` (salto real ya presente) → sin cambios.
- [x] 1.5 Test: `buildServiceAccountFromEnv({ projectId, clientEmail, privateKey })` con los 3 presentes → objeto `{ projectId, clientEmail, privateKey }`.
- [x] 1.6 Test: `buildServiceAccountFromEnv` con `projectId` undefined → lanza `Error` con mensaje que menciona `FIREBASE_PROJECT_ID`.
- [x] 1.7 Test: `buildServiceAccountFromEnv` con `clientEmail` undefined → lanza `Error` que menciona `FIREBASE_CLIENT_EMAIL`.
- [x] 1.8 Test: `buildServiceAccountFromEnv` con `privateKey` undefined → lanza `Error` que menciona `FIREBASE_PRIVATE_KEY`.
- [x] 1.9 Implementar `apps/backend/src/infrastructure/firebase/firebase.config.ts` con `normalizePrivateKey` (reemplaza `\\n` → `\n`, idempotente) y `buildServiceAccountFromEnv` (mapea y lanza errores descriptivos). Verificar GREEN.
- [x] 1.10 Verificar `npm test --workspace=@riff/backend -- --coverage` → los archivos de `firebase.config.ts` y `firebase.tokens.ts` cubiertos; coverage global ≥ 90%.

## 2. Módulos Firebase (TDD con mocks)

- [x] 2.1 Escribir `apps/backend/src/infrastructure/firebase/firebase.module.spec.ts` que falle primero (RED): con `jest.mock('firebase-admin/app')` y `jest.mock('firebase-admin/firestore')`, verificar que `FirebaseModule` provee `FIREBASE_APP` y `FirestoreModule` provee `FIRESTORE`. Módulos aún no existen.
- [x] 2.2 Test: `FirebaseModule` llama `initializeApp` una vez con `credential` (cert) y `projectId` correctos cuando `getApps()` retorna `[]` y las env vars están presentes.
- [x] 2.3 Test: `FirebaseModule` NO llama `initializeApp` de nuevo y reusa `getApp()` cuando `getApps()` retorna un array no vacío.
- [x] 2.4 Test: `FirebaseModule` lanza `Error` descriptivo si falta `FIREBASE_PROJECT_ID` (fail-fast).
- [x] 2.5 Test: `FirestoreModule` llama `getFirestore(app)` con la app inyectada y resuelve el token `FIRESTORE`.
- [x] 2.6 Implementar `apps/backend/src/infrastructure/firebase/firebase.module.ts` (`@Global`, provee `FIREBASE_APP` vía factory con guard `getApps().length === 0 ? initializeApp(...) : getApp()`, usando `buildServiceAccountFromEnv` + `normalizePrivateKey`).
- [x] 2.7 Implementar `apps/backend/src/infrastructure/firebase/firestore.module.ts` (`@Global`, provee `FIRESTORE` vía factory `getFirestore(app)`).
- [x] 2.8 Verificar GREEN y coverage ≥ 90%.

## 3. Integración en AppModule

- [x] 3.1 Actualizar `apps/backend/src/app.module.ts`: importar `ConfigModule.forRoot({ isGlobal: true })`, `FirebaseModule`, `FirestoreModule`.
- [x] 3.2 Verificar `npm run build --workspace=@riff/backend` → exit 0 (el `AppModule` compila con los nuevos imports).
- [x] 3.3 Verificar `npm run typecheck --workspace=@riff/backend` → exit 0.

## 4. Configuración de entorno (.env.example raíz + backend)

- [x] 4.1 Reescribir `.env.example` raíz al stack Riff: secciones `APPLICATION` (NODE_ENV, PORT, NESTJS_API_URL, ASTRO_SITE_URL, ANGULAR_ADMIN_URL), `FIREBASE` (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY con nota de `\n`), `LOGGING` (LOG_LEVEL, LOG_FORMAT), `DEPLOY` (DOCKER_REGISTRY, COOLIFY_API_TOKEN, SLACK_WEBHOOK). Eliminar Postgres/DATABASE_URL, JWT_SECRET/JWT_*, S3/AWS_*, Resend, Sentry, Redis.
- [x] 4.2 Extender `apps/backend/.env.example` con `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (placeholders) y nota de que CORS/Throttler entran en `backend-commons`.
- [x] 4.3 Verificar que el `.env.example` raíz NO contiene `DATABASE_URL`, `JWT_SECRET`, ni `AWS_S3_BUCKET` (grep).
- [x] 4.4 Verificar que `apps/backend/.env.example` contiene `PORT=3000` y las 3 `FIREBASE_*`.

## 5. Documentación (README backend)

- [x] 5.1 Actualizar `apps/backend/README.md`: añadir sección "Firebase setup" con pasos de Firebase Console (crear proyecto → habilitar Firestore → generar service account → descargar JSON → mapear `project_id`/`client_email`/`private_key` a las variables de entorno) y advertencia de no commitear el JSON.
- [x] 5.2 Actualizar la tabla de variables de entorno del README con las 3 `FIREBASE_*`.

## 6. Validación & SDD

- [x] 6.1 `npm run lint --workspace=@riff/backend` → exit 0 (umbrales SOLID: max-lines 300, complexity 10; `.eslintrc.cjs` ignora `*.spec.ts`).
- [x] 6.2 `npm run typecheck --workspace=@riff/backend` → exit 0.
- [x] 6.3 `npm test --workspace=@riff/backend -- --coverage` → all pass + coverage ≥ 90%.
- [x] 6.4 `npm run build --workspace=@riff/backend` → exit 0.
- [x] 6.5 Humo: con `FIREBASE_*` ausentes, `npm run start --workspace=@riff/backend` debe fallar con error descriptivo (fail-fast) y NO quedar escuchando. (Verificar log + que `curl /health` no responde.)
- [x] 6.6 Humo (opcional, requiere credenciales reales del cliente): con `FIREBASE_*` válidas en `.env`, arrancar y confirmar `GET /health` → 200 `{"status":"ok"}`. Si no hay credenciales disponibles, documentar como pendiente y no bloquear.
- [x] 6.7 `openspec validate backend-firebase-config` → valid.
- [x] 6.8 `openspec status --change backend-firebase-config --json` → todos los artefactos done.
- [x] 6.9 Re-ejecutar los escenarios Gherkin de `backend-firebase` y el delta de `backend-runtime` contra la implementación (módulos con mocks, helpers puros, env.example, README).
- [x] 6.10 Adversarial review (skill `code-auditing` lente Architect/SOLID): zero critical warnings en `src/infrastructure/firebase/`, `app.module.ts`, `.env.example` raíz y del backend, `README.md`. Documentar hallazgos no bloqueantes (p. ej., credenciales reales pendientes del cliente).
