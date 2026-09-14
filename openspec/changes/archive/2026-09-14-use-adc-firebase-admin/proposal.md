# Proposal: Migrate Firebase Admin to Application Default Credentials (ADC)

- **Ticket ID**: RIFF-DEPLOY-01 (Change 0 del plan de despliegue)
- **Título original**: "[backend] Migrate Firebase Admin to Application Default Credentials"
- **Tag**: `[backend]`
- **Change name**: `use-adc-firebase-admin`

## Motivación

El backend hoy inicializa Firebase Admin con un service account explícito
descompuesto en tres variables de entorno (`FIREBASE_PROJECT_ID`,
`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) via
`buildServiceAccountFromEnv()` + `cert()`. Esto obliga a:

- Guardar la clave privada del service account en Secret Manager de GCP y
  montarla como env var en Cloud Run: superficie de secreto innecesaria y
  proceso de rotación manual.
- Mantener el mismo contrato localmente, donde los desarrolladores deben
  gestionar un JSON de service account solo para ejecutar la app.

Con la infraestructura de staging ya provisionada (service account de runtime
`riff-api-runtime`, Workload Identity Federation en CI), el runtime puede usar
**Application Default Credentials (ADC)**: `applicationDefault()` resuelve la
identidad del servicio en Cloud Run sin ninguna credencial explícita.

## Alcance

1. `FirebaseModule` pasa a inicializar con `applicationDefault()` +
   `FIREBASE_PROJECT_ID` + `FIREBASE_STORAGE_BUCKET` (ambas fail-fast con
   `getOrThrow`), conservando el patrón singleton `getApps()/getApp()`.
2. `buildServiceAccountFromEnv()` queda sin consumidores en el runtime pero
   `normalizePrivateKey()` sigue siendo usada por los CLIs locales
   (`cli/migrate/firebase-migration.adapter.ts`), que se ejecutan fuera de
   Cloud Run con un service account JSON explícito. Se decide en este change
   el destino exacto de `firebase.config.ts` (mantener solo
   `normalizePrivateKey` vs. conservar ambos exports).
3. Actualización del contrato de entorno (`.env.example` raíz y backend) y de
   la tabla de variables de `docs/deploy-standards.md`: el runtime ya no requiere
   `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY`; se documentan como
   exclusivas de CLIs locales, y se documenta el setup local con ADC
   (`gcloud auth application-default login`).

## Fuera de alcance

- Cambiar los CLIs de migración/seed para usar ADC (siguen con SA explícito).
- Creación de infraestructura GCP (ya realizada como operaación manual).
- Cambios en `apps/web` ni `apps/admin`.

## Riesgos

- **Cold-start fail-fast**: si `FIREBASE_STORAGE_BUCKET` no está configurada en
  Cloud Run, el servicio no arranca. Mitigación: validar despliegue en staging
  antes de producción (smoke `/health` ya existe en `deploy.yml`).
- **Desarrollo local**: ahora exige `gcloud auth application-default login`.
  Documentado en `.env.example` como parte del change.
- **E2E de backend** (`test:e2e` con Firestore fake in-memory): debe seguir
  verde sin credenciales reales; los specs del módulo se mockean.
