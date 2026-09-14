# Tasks — use-adc-firebase-admin

> Capas: `infrastructure` (el provider de Firebase vive en
> `apps/backend/src/infrastructure/firebase/`). No toca `domain/` ni
> `application/`. `.specboot.json` declara `services: ["."]`.

## Task 1 — Actualizar specs del `FirebaseModule` a ADC (RED)

**Prioridad**: Alta · **Capa**: infrastructure (tests) · **Estimación**: S

- [x] Actualizar `firebase.module.spec.ts`:
  - Reemplazar el mock de `cert` y de `buildServiceAccountFromEnv` por el mock de `applicationDefault` en `jest.mock('firebase-admin/app', ...)`.
  - Añadir `FIREBASE_STORAGE_BUCKET` al fixture `FIREBASE_ENV`.
  - Ajustar SC-001: afirmar `initializeApp` invocado con `{ credential: applicationDefault(), projectId: 'riff-catalogo', storageBucket: 'webappriff.firebasestorage.app' }` (mejor: `expect.objectContaining`).
  - Ajustar SC-002 (singleton) y añadir SC-003/SC-004 (fail-fast sin `FIREBASE_PROJECT_ID` y sin `FIREBASE_STORAGE_BUCKET`).
- [x] Verificar que el test falla (RED) antes de modificar el código de producción.

**Suggested Path**: `apps/backend/src/infrastructure/firebase/firebase.module.spec.ts`
**Test Path**: `apps/backend/src/infrastructure/firebase/`

## Task 2 — Refactor `firebase.module.ts` a ADC

**Prioridad**: Alta · **Capa**: infrastructure · **Estimación**: S

- [x] Reemplazar `import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';` por la versión sin `cert` y con `applicationDefault`.
- [x] Eliminar `import { buildServiceAccountFromEnv } from './firebase.config';`.
- [x] Sustituir el `useFactory` de `FIREBASE_APP` para que, cuando `getApps().length === 0`, inicialice con:
  - `credential: applicationDefault()`
  - `projectId: config.getOrThrow<string>('FIREBASE_PROJECT_ID')`
  - `storageBucket: config.getOrThrow<string>('FIREBASE_STORAGE_BUCKET')`
  - y devuelva `getApp()` cuando ya exista una app.
- [x] Mantener el `FIREBASE_AUTH` provider inalterado (`getAuth(app)`).
- [x] Sin `any`; `App` tipado desde `firebase-admin/app`.

**Suggested Path**: `apps/backend/src/infrastructure/firebase/firebase.module.ts`
**Test Path**: `apps/backend/src/infrastructure/firebase/firebase.module.spec.ts`

## Task 3 — Resolver destino de `firebase.config.ts` (grep definitivo)

**Prioridad**: Media · **Capa**: infrastructure · **Estimación**: S

- [x] Ejecutar grep de `buildServiceAccountFromEnv` en `apps/backend/src` y confirmar que tras Task 2 no quedan consumidores en runtime.
- [x] Decidir y ejecutar una de estas opciones (documentando en el PR):
  - **(a) Caro mínimo**: mantener `firebase.config.ts` exportando solo `normalizePrivateKey` (usado por `cli/migrate/firebase-migration.adapter.ts`), eliminando `buildServiceAccountFromEnv` y ajustando `firebase.config.spec.ts` en consecuencia (dejar tests de `normalizePrivateKey`).
  - **(b) Conservadora**: mantener ambos exports marcando `buildServiceAccountFromEnv` como deprecated para runtime (solo si algo más lo consume).
- [x] Ajustar `firebase.config.spec.ts` según la opción elegida (eliminar suite del builder huérfano o conservarla).
- [x] Verificar `test:cov` del backend se mantiene ≥ 90 % tras la limpieza.

**Suggested Path**: `apps/backend/src/infrastructure/firebase/firebase.config.ts`, `apps/backend/src/infrastructure/firebase/firebase.config.spec.ts`
**Test Path**: `apps/backend/src/infrastructure/firebase/`

## Task 4 — Actualizar contrato de entorno local

**Prioridad**: Media · **Capa**: infrastructure (documentación de config) · **Estimación**: S

- [x] `apps/backend/.env.example`: marcar `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` como **solo CLIs locales** (seed/migrate/bootstrap), añadir comentario de que el runtime usa ADC con `FIREBASE_PROJECT_ID` + `FIREBASE_STORAGE_BUCKET`, y documentar `gcloud auth application-default login` para desarrollo local.
- [x] `.env.example` raíz: misma actualización semántica en la sección FIREBASE.

**Suggested Path**: `apps/backend/.env.example`, `.env.example`
**Test Path**: no aplica (archivos de configuración de muestra; si existe test de sync de env, ajustarlo)

## Task 5 — Sincronizar `docs/deploy-standards.md`

**Prioridad**: Media · **Capa**: docs · **Estimación**: S

- [x] En la tabla de Environment Variables, redefinir:
  - `FIREBASE_PROJECT_ID` y `FIREBASE_STORAGE_BUCKET` → ambiente runtime (Cloud Run, vía variable de entorno, no secreto de clave privada).
  - `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` → **solo CLIs locales**, no montados en Cloud Run.
- [x] Añadir nota: Cloud Run autentica con la service account de runtime del servicio (`riff-api-runtime`) vía Application Default Credentials; sin JSON keys.
- [x] Verificar que `docs/deploy-standards.md` no contradiga el resto de la sección de secretos.

**Suggested Path**: `docs/deploy-standards.md`
**Test Path**: no aplica

## Task 6 — Verificación de suite completa

**Prioridad**: Alta · **Capa**: transversal · **Estimación**: S

- [x] Ejecutar `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:cov` y `npm run test:e2e` en `apps/backend` → todo verde sin credenciales Firebase reales.
- [x] Confirmar que `firebase-infra.spec.ts` (reglas/índices/firebase.json) sigue verde — no debería verse afectado.
- [x] `bash check-refs.sh` y `bash specboot.sh --ci` en verde (aplican al repo completo).

**Suggested Path**: no aplica (verificación transversal)
**Test Path**: `apps/backend/src/infrastructure/firebase/`

## Mandatory Steps

> Checklist obligatoria inyectada desde `docs/openspec-tasks-mandatory-steps.md`
> (fuente única de verdad) en el momento de generación del `tasks.md`.

### Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [x] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [x] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

### Durante la implementación

- [x] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [x] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

### Post-implementación

Antes de dar la tarea por cerrada:

- [x] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [x] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).
