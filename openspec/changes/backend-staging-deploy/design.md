# Design: backend-staging-deploy

## Context

**Estado actual.** Existe un servicio Cloud Run `riff-api-staging` en el
proyecto de infraestructura `webappriff` (región `southamerica-west1`), creado
históricamente por el workflow `.github/workflows/deploy.yml` con
`google-github-actions/deploy-cloudrun@v3` (hoy eliminado; la lane backend de
CI/CD está "pendiente de implementar como workflow propio" según
`docs/deploy-standards.md`). Ese servicio quedó con `FIREBASE_PROJECT_ID`
apuntando al proyecto `WebAppRiff`: rechaza los tokens del panel admin
(emitidos por `riff-catalogo-staging`, firma/audience no coinciden) y no ve el
superadmin `soporte@gabrielzavando.cl`, que solo existe en
`riff-catalogo-staging`. La verificación 7.5 de `deploy-docker-hardening`
(archivado) quedó bloqueada por esto.

**Hallazgos de la investigación en el repo** (Fase 1):

- `apps/backend/Dockerfile` **ya existe**: multi-stage (stage 0 compila
  `@riff/html-sanitize`; stage 1 `npm ci --workspace=@riff/backend` + build +
  `npm prune --omit=dev`; stage 2 runtime `node:24-slim`, `USER node`,
  `CMD ["node", "dist/main.js"]`). Contexto de build = raíz del monorepo.
- El backend ya es Cloud Run-ready: `resolvePort(process.env.PORT)`
  (`apps/backend/src/config/port.ts`) respeta el `PORT=8080` que Cloud Run
  inyecta; el `EXPOSE 3000` del Dockerfile es solo declarativo.
- Variables de entorno runtime (`apps/backend/.env.example`,
  `apps/backend/src/infrastructure/firebase/firebase.module.ts`): el backend
  solo exige `FIREBASE_PROJECT_ID` y `FIREBASE_STORAGE_BUCKET`
  (`getOrThrow`, fail-fast al arrancar). La autenticación contra Firebase
  Admin es por **ADC** (`applicationDefault()`), nunca por claves privadas en
  runtime. `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` son solo del CLI raw
  `migrate:firestore` y "no se montan en Cloud Run" (regla de
  `docs/deploy-standards.md`).
- CORS (`buildCorsOptions`, `apps/backend/src/common/config/cors.config.ts`):
  con `NODE_ENV=production` la allowlist es estricta y fail-closed, formada por
  `ASTRO_SITE_URL` (sitio Astro) y `ANGULAR_ADMIN_URL` (admin Angular).
  Conviene añadir el origen del admin de staging y el del sitio web de staging
  como valores de esas dos variables (no hay que cambiar código).
- Endpoints de verificación: `GET /health` (raíz, sin prefijo; hace ping a
  Firestore con timeout) y `GET /api/v1/auth/me` (protegido por
  `FirebaseAuthGuard` → 401 sin token). Smoke automatizado disponible:
  `SMOKE_API_URL=... npm run smoke:api` (valida `/health` con `firebase: up` y
  products/categories/subcategories).
- No hay workflow de deploy de backend ni scripts de deploy en el repo (solo
  `ci.yml`); la configuración viva del servicio actual está en GCP, fuera del
  repo.

**Constraints.** Arquitectura aprobada 2026-09-08 (`docs/deploy-standards.md`):
Cloud Run para la API, región `southamerica-west1`, URLs `*.run.app`
provisionales hasta DNS, proyecto Firebase de staging separado
(`riff-catalogo-staging`), ADC sin JSON keys, Artifact Registry como registry,
tag `sha-<commit>` (prohibido `latest`).

**Confirmaciones del owner (2026-10-13)** — resuelven todas las dudas de la
investigación: billing de `riff-catalogo-staging` habilitado; dominios de
staging definitivos en uso (`https://admin-staging.somosriff.cl` admin,
`https://staging.somosriff.cl` web, backend en `*.run.app` sin dominio propio);
bucket de Storage `riff-catalogo-staging.firebasestorage.app`; runtime SA
dedicada `riff-api-runtime@riff-catalogo-staging.iam.gserviceaccount.com` con
solo `roles/datastore.user` y `roles/storage.objectAdmin`; webhook de catálogo
no-op en staging (sin secretos; se activará con el pipeline de rebuild del
sitio en un change posterior); servicio antiguo de `webappriff` congelado (no
borrar) y documentado como deuda de decomisión futura.

## Goals / Non-Goals

**Goals:**

- Una instancia del backend NestJS en Cloud Run **dentro de
  `riff-catalogo-staging`**, con URL `*.run.app` pública y propia.
- Escalado a cero (`min-instances=0`) con techo razonable (`max-instances=2`).
- Runbook con comandos exactos y repetibles (build → push → deploy → smoke).
- Tokens del admin de staging verificados por la nueva instancia (mismo
  proyecto Firebase) y superadmin accesible desde el panel.
- Desbloquear la verificación 7.5 de `deploy-docker-hardening`.
- Documentar en `docs/deploy-standards.md` la nueva topología de staging y los
  prerrequisitos ops.

**Non-Goals:**

- No se toca el servicio existente `riff-api-staging` de `webappriff` (queda
  congelado, no se borra; su decomisión queda documentada como deuda futura).
- No se reconfigura la web Astro de staging (`NESTJS_API_URL` /
  `PUBLIC_API_URL` en Coolify) — se documenta como follow-up recomendado.
- No se implementa workflow de GitHub Actions para la lane backend (sigue
  "pendiente"; el runbook manual es el MVP de este change).
- No hay dominio propio ni domain mapping (`api-staging.somosriff.cl` queda
  para cuando exista DNS).
- Sin cambios de código TypeScript en backend ni admin (salvo que la
  verificación detecte un defecto real, lo que sería un change aparte).

## Decisions

1. **Nuevo servicio en `riff-catalogo-staging` en vez de reparar el de
   `webappriff`.** Alternativa descartada: apuntar
   `FIREBASE_PROJECT_ID=riff-catalogo-staging` en el servicio de `webappriff`
   con IAM cross-project. Motivos: (a) decisión del owner de alinear
   identidad/datos/API en el proyecto staging; (b) aislamiento limpio de
   entornos sin dependencias cross-project; (c) el servicio actual quedó
   desalineado y su configuración vive fuera del repo. Nombre propuesto:
   `riff-api-staging` dentro de `riff-catalogo-staging` (los nombres de
   servicio Cloud Run son por-proyecto; se documenta la ambigüedad y que el
   servicio homónimo de `webappriff` queda congelado).

2. **Credenciales: ADC + service account de runtime dedicada (estándar del
   repo), no claves privadas.** La instrucción original planteaba copiar
   `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` del SA de
   `riff-catalogo-staging` como variables de entorno. Descartado (confirmado
   por el owner): contradice el estándar aprobado (`.env.example`: "runtime via
   Application Default Credentials — ADC"; `firebase.module.ts` usa
   `applicationDefault()`; `deploy-standards.md`: "sin JSON keys ni secretos de
   clave privada"). En un servicio desplegado **dentro de**
   `riff-catalogo-staging`, ADC resuelve la identidad local del proyecto sin
   ninguna credencial montada. Runtime SA (confirmada):
   `riff-api-runtime@riff-catalogo-staging.iam.gserviceaccount.com` (espejo del
   patrón `GCP_RUNTIME_SA` de `webappriff`), con mínimo privilegio:
   `roles/datastore.user` (Firestore) y `roles/storage.objectAdmin` sobre el
   bucket de staging, nada más. El runbook documenta los comandos exactos:
   `gcloud iam service-accounts create` + dos
   `gcloud projects add-iam-policy-binding` (uno por rol). Alternativa
   descartada: default compute SA del proyecto (rechazada por mínimo privilegio
   y paridad con el patrón aprobado). En runtime solo se fijan
   `FIREBASE_PROJECT_ID=riff-catalogo-staging` y
   `FIREBASE_STORAGE_BUCKET=riff-catalogo-staging.firebasestorage.app`.

3. **Registry: Artifact Registry dentro de `riff-catalogo-staging`** (repo
   `riff`, imagen `riff-backend`, tag `sha-<commit>`). Alternativa descartada:
   reutilizar el repo `riff` de `webappriff` (requeriría
   `artifactregistry.reader` cross-project para el runtime SA y complica el
   despliegue). Mantiene el proyecto staging autocontenido.

4. **Despliegue manual via runbook (gcloud), no workflow nuevo.**
   `deploy-standards.md` deja la lane backend de CI/CD como pendiente; este
   change entrega el runbook con comandos exactos (`docker build` contexto
   raíz → `gcloud builds submit`/`docker push` a AR →
   `gcloud run deploy --allow-unauthenticated --min-instances=0
   --max-instances=2 --service-account=...`). Opcionalmente un target de
   Makefile para el build de imagen (paridad con `make docker-build`). El
   workflow de GitHub Actions queda para un change futuro.

5. **Variables de entorno de la instancia staging** (en `gcloud run deploy`):
   - `NODE_ENV=production` (activa la allowlist CORS estricta; el Dockerfile ya
     la fija, se declara explícita por trazabilidad).
   - `PORT`: no se fija — Cloud Run inyecta 8080 y `resolvePort` lo lee.
   - `FIREBASE_PROJECT_ID=riff-catalogo-staging`,
     `FIREBASE_STORAGE_BUCKET=riff-catalogo-staging.firebasestorage.app`.
   - `ASTRO_SITE_URL=https://staging.somosriff.cl`,
     `ANGULAR_ADMIN_URL=https://admin-staging.somosriff.cl` (dominios
     definitivos de staging, confirmados por el owner).
   - `RESEND_API_KEY`: sin configurar (notifier no-op con warning, aceptado en
     staging por instrucción del owner).
   - `CONTACT_TO_EMAIL`/`CONTACT_FROM_EMAIL`: defaults (no se fijan).
   - `CATALOG_REBUILD_WEBHOOK_URL`/`CATALOG_REBUILD_WEBHOOK_TOKEN`: no-op
     confirmado por el owner — **no se crean secretos** ni se configuran; se
     activarán cuando exista el pipeline de rebuild del sitio (change
     posterior).
   - No se montan `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` (ver decisión
     2).

6. **Acceso público e ingress.** `--allow-unauthenticated`: los endpoints
   públicos (`/health`, productos, categorías, cotizaciones, contacto) y el
   smoke lo exigen; los endpoints admin quedan protegidos por
   `FirebaseAuthGuard` a nivel aplicación. Sin VPC connector ni ingress
   restringido.

7. **Escalado.** `--min-instances=0 --max-instances=2`: cero costo en reposo
   (objetivo del owner) y techo acotado para staging; cold start aceptado
   (staging, no producción). CPU solo durante requests (default de Cloud Run,
   compatible con escala a cero).

8. **Sin dominio propio.** URL `*.run.app` provisional, alineado con
   `deploy-standards.md` (domain mapping cuando exista DNS).

## Risks / Trade-offs

- [IAM incompleto al arrancar (Firestore/Storage denegados)] → checklist ops
  con los roles exactos (`roles/datastore.user`, `roles/storage.objectAdmin`
  sobre el bucket) y smoke `/health` que expone `firebase: down` si el ping
  falla.
- [Confusión entre los dos servicios `riff-api-staging` (webappriff vs
  riff-catalogo-staging)] → documentar en `deploy-standards.md` que el de
  `webappriff` queda congelado; distinguir siempre por proyecto en los
  comandos (`--project`).
- [CORS fail-closed si las URLs de staging mal escritas] → mitigado: valores
  confirmados (`https://staging.somosriff.cl`,
  `https://admin-staging.somosriff.cl`); verificación explícita:
  `curl -I -X OPTIONS` con `Origin` del admin y del web; smoke de login desde
  el panel.
- [Cold starts (~1-3 s) al escalar desde cero] → aceptado en staging;
  `min-instances>0` solo se reconsiderará tras medir (ya anotado en
  `deploy-standards.md`).
- [Catálogo vacío en staging] → el smoke solo exige arreglo `data`; si se
  quiere smoke "no vacío", re-ejecutar `npm run seed:catalog` /
  `npm run seed:productos` apuntando a `riff-catalogo-staging` (ya existe
  documentación en `deploy-standards.md`).
- [Secretos nunca en repo ni logs] → solo se usan variables no sensibles en
  `--set-env-vars` (confirmado: no hay secretos que configurar en esta ronda);
  si más adelante se activa el webhook, vía `--set-secrets` + Secret Manager.

## Migration Plan

1. **Prerrequisitos ops (operador, en GCP)**: billing ya habilitado
   (confirmado); habilitar APIs Cloud Run + Artifact Registry; crear la runtime
   SA con los comandos exactos del runbook (`gcloud iam service-accounts create
   riff-api-runtime --project=riff-catalogo-staging` + dos
   `gcloud projects add-iam-policy-binding` — `roles/datastore.user` y
   `roles/storage.objectAdmin` — sobre `riff-catalogo-staging`); permisos del
   operador para desplegar.
2. **Build & push**: `docker build -f apps/backend/Dockerfile -t
   <REGION>-docker.pkg.dev/riff-catalogo-staging/riff/riff-backend:sha-<commit>
   .` (contexto raíz) y push a AR de `riff-catalogo-staging`.
3. **Deploy**: `gcloud run deploy riff-api-staging --project
   riff-catalogo-staging --region southamerica-west1` con env vars y flags de
   las decisiones 5-7. Anotar la URL `*.run.app` resultante.
4. **Smoke backend**: `SMOKE_API_URL=<URL> npm run smoke:api` +
   `curl /auth/me` sin token → 401.
5. **Coolify (manual en panel)**: configurar `API_BASE_URL` (y Build Variables
   Firebase del admin si faltan) en `riff-admin-staging` apuntando a la nueva
   URL; redeploy del admin.
6. **Verificación admin**: login con `soporte@gabrielzavando.cl` y carga de
   perfil (`/auth/me` 200 desde el panel).
7. **Cerrar 7.5**: actualizar la nota de bloqueo en
   `openspec/changes/archive/2026-10-12-deploy-docker-hardening/tasks.md` (o
   su `verification.md`) y `docs/deploy-standards.md`.

**Rollback**: la nueva instancia no tiene consumidores obligatorios hasta el
paso 5. Rollback = `gcloud run services delete riff-api-staging --project
riff-catalogo-staging --region southamerica-west1` (o revertir tráfico a la
revisión sana previa con `update-traffic` si ya hubo deploys buenos). El
servicio antiguo de `webappriff` **no se toca en ningún caso** (congelado;
deuda de decomisión futura).

## Open Questions

Ninguna pendiente: las seis dudas de la investigación quedaron resueltas por
el owner el 2026-10-13 (ver "Confirmaciones del owner" en Context) y están
integradas en las decisiones 2 y 5 y en el plan de migración.
