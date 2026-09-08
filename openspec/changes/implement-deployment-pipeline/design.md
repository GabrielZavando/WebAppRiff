## Context

La decisión de arquitectura está aprobada y documentada (`decide-api-deployment-architecture`): API NestJS en **Cloud Run** (`southamerica-west1`), frontends Astro/Angular como servicios estáticos en **Coolify** (VPS), Firebase gestionado. Dominios aprobados: `somosriff.cl`, `admin.somosriff.cl`, `api.somosriff.cl`; staging con proyecto Firebase separado `riff-catalogo-staging` y subdominios `staging.somosriff.cl` / `admin-staging.somosriff.cl`.

Estado real del repo:

- `apps/backend/Dockerfile`: multi-stage Node 22, contexto raíz del monorepo, usuario no-root — **reutilizable tal cual** para Cloud Run.
- `apps/web`: Astro 7 `output: 'static'`; `lib/api/*` hace fetch en build-time con caché y fallback silencioso a `[]` (`products.ts:45-51`) — riesgo de publicar catálogo vacío.
- `apps/admin`: Angular 18 placeholder; su Dockerfile puede crearse ya (compila el shell actual) para tener el loop de imagen validado antes del desarrollo real.
- `.github/workflows/deploy.yml`: roto (busca `Dockerfile` en raíz: `deploy.yml:20,46`; build sin push: `:24,50`; rollback a tag `:previous` inexistente: `:79`; `docker run` sin env vars: `:36,62`).
- `.env.example`: `NESTJS_API_URL=http://localhost:3000` sin `/api/v1` (el código espera base **con** `/api/v1`: `products.ts:20`); `SITE_URL` y `CATEGORIES_WEBHOOK_URL` ausentes; `LOG_LEVEL`/`LOG_FORMAT` sin consumidores.

## Goals / Non-Goals

**Goals:**

- Imágenes Docker reproducibles y verificables localmente para los tres servicios.
- Pipeline backend: merge a `main` → build → push Artifact Registry → deploy `riff-api-staging` → smoke; promoción manual a `riff-api-prod`.
- Contrato de env sincronizado (`SITE_URL`, `NESTJS_API_URL` con `/api/v1`, `CATEGORIES_WEBHOOK_URL`) y builds productivos de Astro fail-fast sin API.
- Eliminar el flujo SSH/docker manual y sus defectos.

**Non-Goals:**

- No se configura Coolify (recursos, dominios, TLS) — se hace en la plataforma al desplegar; este change entrega los Dockerfiles que Coolify consume.
- No se endurece `make ci` (cobertura bloqueante, typecheck, audit sin `|| true`) — ticket C1 separado.
- No se crea el proyecto/staging real en GCP ni se registran dominios.
- No se cambia el panel admin funcional ni contratos REST.

## Decisions

### 1. Dockerfiles frontends: multi-stage con contexto raíz y servidor estático

Patrón idéntico al del backend (contexto = raíz del monorepo porque `npm ci --workspace` exige el lockfile raíz):

- **`apps/web/Dockerfile`**: stage build (`npm ci --workspace=@riff/web` → `astro build` con `SITE_URL` y `NESTJS_API_URL` como build-args) → stage runtime con **nginx** (imagen `nginx:alpine`) sirviendo `dist/`, healthcheck sobre `GET /` y gzip habilitado. Sin Node en runtime.
- **`apps/admin/Dockerfile`**: stage build (`npm ci --workspace=@riff/admin` → `ng build`) → runtime `nginx:alpine` con `try_files ... /index.html` (SPA fallback) y healthcheck.

Se elige nginx (no Caddy) por imagen mínima y configuración declarativa simple; ambos frontends son 100% estáticos (no hay secretos en runtime).

### 2. Pipeline backend: GitHub Actions → Artifact Registry → Cloud Run

- Un único workflow reemplaza a `deploy.yml` (nombre conservado para minimizar fricción, contenido nuevo).
- **Autenticación GCP**: Workload Identity Federation (sin JSON keys); permisos mínimos (Artifact Registry Writer + Cloud Run Deployer sobre los dos servicios).
- **Staging** (push a `main`): build/push `riff-backend:sha-<commit>` → `gcloud run deploy riff-api-staging` (región `southamerica-west1`) con secretos desde Secret Manager → smoke `GET /health`.
- **Producción** (tag `v*` o `workflow_dispatch` con confirmación): deploy de la **misma imagen** taggeada a `riff-api-prod` + smoke. Nunca `latest`; el rollback es revert de revisión en Cloud Run.
- **Frontends**: el workflow no los despliega; comentario/step opcional que dispara el webhook de Coolify (`COOLIFY_WEBHOOK_URL`) si está definido. Coolify detecta el push y hace build in-situ (estándar de la plataforma).

### 3. Contrato de env: normalizar en código, sincronizar `.env.example`, fail-fast en producción

- **Normalización en `lib/api/*`**: una única función `resolveApiBaseUrl()` que garantiza que la base termine en `/api/v1` (acepta valores con o sin sufijo; el fallback por defecto pasa a `http://localhost:3000/api/v1`). Elimina la clase entera de errores por configuración.
- **Fail-fast**: nueva variable `REQUIRE_API` (build-arg en Docker). En builds con `REQUIRE_API=true`: si el catálogo inicial (`getPublicProducts()`) falla o llega vacío, `astro build` **falla** con error explícito. En dev/staging sin la variable, se mantiene el fallback actual con warning. Categorías/subcategorías adoptan el mismo comportamiento vía la misma utilidad.
- **`.env.example`**: se sincroniza con el código (añade `SITE_URL`, `REQUIRE_API`, `CATEGORIES_WEBHOOK_URL`; corrige `NESTJS_API_URL` a `http://localhost:3000/api/v1`; elimina `LOG_LEVEL`/`LOG_FORMAT` muertas).

### 4. Verificación local obligatoria antes de merge

Cada Dockerfile se construye localmente (`docker build -f apps/<app>/Dockerfile .`) y se prueba su servidor estático con curl al healthcheck; la imagen backend se valida con `docker run` + `GET /health`. GitHub Actions añade job `docker-build` que compila las tres imágenes en PR (sin push) para que el pipeline no llegue roto a staging.

## Risks / Trade-offs

- **[Build Astro acoplado al API en producción]** → El fail-fast convierte el riesgo de catálogo vacío en build rojo visible; el smoke de staging lo detecta antes de promover.
- **[WIF mal configurado]** → Documentar el setup (provider, service account, roles) como paso manual previo con verificación `act`/dry-run; el workflow falla temprano en auth si falta.
- **[nginx sin compresión brotli]** → gzip estándar habilitado; brotli queda como mejora posterior del ticket de rendimiento W3.
- **[Coolify build sin cache de npm]** → Aceptado en MVP (builds pocos frecuentes); revisar registry GHCR si los builds se vuelven lentos.
- **[REQUIRE_API olvidado en un deploy real]** → El Dockerfile de web define `ARG REQUIRE_API` y el workflow/pipeline de Coolify lo fija en `ENV REQUIRE_API=true` para el build de producción por defecto.

## Migration Plan

1. Crear los tres artefactos de imagen (2 Dockerfiles nuevos + workflow nuevo) y el contrato de env; validar builds localmente.
2. En PR: job `docker-build` compila las tres imágenes (sin push); tests web existentes (vitest) cubren `resolveApiBaseUrl()` y fail-fast (RED primero).
3. Merge a `main` → deploy automático a staging (backend) + build in-situ Coolify (frontends) → smoke verde.
4. Registro de dominios y recursos GCP/Coolify (manual, fuera del repo) con los valores aprobados.
5. Promoción manual a producción; rollback probado una vez con la revisión anterior de Cloud Run.

**Rollback**: revert de revisión en Cloud Run / redeploy anterior en Coolify; el workflow nuevo se desactiva con `workflow_dispatch` off si algo falla, restaurando el anterior desde git.

## Open Questions

- ¿Nombre exacto del repo en Artifact Registry (propuesto: `riff/riff-backend`)? — decidible al crear el recurso GCP.
- ¿El trigger de Coolify será automático por Git (recomendado) o vía webhook manual desde Actions? — no bloquea este change (ambos compatibles).
