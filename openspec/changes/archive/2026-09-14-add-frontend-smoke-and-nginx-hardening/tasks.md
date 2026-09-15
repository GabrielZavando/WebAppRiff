# Tasks — add-frontend-smoke-and-nginx-hardening

> Capas: frontend (web Astro, admin Angular — nginx conf), CI/CD (smoke hooks),
> docs (rollback). `.specboot.json` `services: ["."]`.

## Task 1 — Script `smoke:api`

**Prioridad**: Alta · **Capa**: scripts/CI · **Estimación**: S

- [x] Crear `scripts/smoke/api.sh` (o `.mjs`): dado `SMOKE_API_URL`, valida
  `GET /health` (parse JSON: `status` ok + `firebase` up) y `GET /api/v1/products`,
  `/api/v1/categories`, `/api/v1/subcategories` (200 + array `data`).
- [x] No-op con aviso si `SMOKE_API_URL` no está definida.
- [x] Añadir npm script `smoke:api` en la raíz.

**Suggested Path**: `scripts/smoke/api.*`
**Test Path**: `scripts/smoke/__tests__/` (o no aplica — script bash, validar con fixture)

## Task 2 — Script `smoke:web`

**Prioridad**: Alta · **Capa**: scripts/CI · **Estimación**: S

- [x] Crear `scripts/smoke/web.sh` (o `.mjs`): dado `SMOKE_WEB_URL`, valida home 200,
  `/productos` 200, existe ≥1 producto publicado (parsear catálogo o HTML), una
  ruta `/productos/{slug}` válida 200, y al menos un asset `/_astro/*` carga.
- [x] No-op con aviso si `SMOKE_WEB_URL` no está.
- [x] Añadir npm script `smoke:web`.

**Suggested Path**: `scripts/smoke/web.*`
**Test Path**: `scripts/smoke/__tests__/`

## Task 3 — Script `smoke:admin`

**Prioridad**: Alta · **Capa**: scripts/CI · **Estimación**: S

- [x] Crear `scripts/smoke/admin.sh` (o `.mjs`): dado `SMOKE_ADMIN_URL`, valida `/`
  200, una ruta interna directa (`/productos`) usa el fallback SPA (responde HTML,
  no 404), el contenido principal se renderiza (marca `app-root` o equivalente), y
  los assets JS/CSS (`/assets/*`) cargan.
- [x] No-op con aviso si `SMOKE_ADMIN_URL` no está.
- [x] Añadir npm script `smoke:admin`.

**Suggested Path**: `scripts/smoke/admin.*`
**Test Path**: `scripts/smoke/__tests__/`

## Task 4 — Hookear smoke tests en deploy.yml

**Prioridad**: Alta · **Capa**: CI/CD · **Estimación**: M

- [x] En `.github/workflows/deploy.yml`, en `deploy-backend-staging` (tras el smoke
  de API existente) y en `deploy-frontends-staging`/`deploy-frontends-production`,
  invocar los scripts `smoke:api`/`smoke:web`/`smoke:admin` del ambiente con las
  URLs correctas (URL de Cloud Run para API, webhook/dominio Coolify o URLs de
  ambiente para web/admin).
- [x] Como Coolify construye asíncomamente, los smoke de Astro/Angular usan
  **polling** (bucle de reintentos con sleep, p. ej. 20×30s o `timeout-minutes`)
  hasta que el deploy recién disparado esté vivo; el fallo tras el timeout agota el
  job.
- [x] El fallo de un smoke marca el job como fallido (no usar `|| true`).
- [x] Pasar las URLs por env del job; no-op si faltan.

**Suggested Path**: `.github/workflows/deploy.yml`
**Test Path**: no aplica (validación estática YAML)

## Task 5 — Hardening nginx web

**Prioridad**: Alta · **Capa**: frontend (web) · **Estimación**: S

- [x] `apps/web/nginx.conf`: añadir `Cache-Control "no-cache"` a HTML/`index.html`;
  `/_astro/` inmutable (ya existente); conservar 404 estática.
- [x] Añadir headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, CSP base compatible (sin romper estilos/scripts inline).
- [x] Repetir los security headers + CSP explícitamente en **cada location** que
  defina `add_header` (nginx `add_header` no hereda si el location define uno
  propio) — para que `index.html`/SPA fallback no pierdan los headers.
- [x] Verificar la sintaxis de nginx y que el 404.html sigue funcionando.

**Suggested Path**: `apps/web/nginx.conf`
**Test Path**: no aplica (validación de imagen/`nginx -t` opcional)

## Task 6 — Hardening nginx admin

**Prioridad**: Alta · **Capa**: frontend (admin) · **Estimación**: S

- [x] `apps/admin/nginx.conf`: `index.html` `no-cache`; `/assets/*` immutable;
  conservar SPA fallback a `index.html`.
- [x] Añadir headers de seguridad (mismos que web, CSP compatible), repetidos
  explícitamente en cada location con `add_header` (sobre todo el SPA fallback y
  `index.html`).
- [x] Verificar la sintaxis de nginx y el fallback SPA.

**Suggested Path**: `apps/admin/nginx.conf`
**Test Path**: no aplica

## Task 7 — Documentar rollback y migración URLs

**Prioridad**: Media · **Capa**: docs · **Estimación**: M

- [x] `docs/deploy-standards.md` § Rollback: completar con (a) cómo identificar la
  última revisión sana, (b) `gcloud run services update-traffic ... --to-revisions
  <previous>=100`, (c) redesplegar el commit previo en Coolify, (d) qué smoke
  ejecutar tras el rollback, (e) quién autoriza la promoción a producción.
- [x] Añadir § "URLs provisionales → definitivas": checklist de migración cuando
  `somosriff.cl` exista (Build Variables Coolify, redeploys, CORS en Cloud Run,
  domain mapping de la API).

**Suggested Path**: `docs/deploy-standards.md`
**Test Path**: no aplica

## Task 8 — Verificación de suite

**Prioridad**: Alta · **Capa**: transversal · **Estimación**: S

- [x] `bash check-refs.sh` y `bash specboot.sh --ci` → 0 errores.
- [x] Validar sintaxis nginx (si `nginx` disponible, `nginx -t` con los confs; si
  no, revisión estática).
- [x] Confirmar que `deploy.yml` sigue YAML válido.
- [x] Confirmar que los scripts de smoke son ejecutables y no-op con URL ausente.

**Suggested Path**: no aplica (transversal)
**Test Path**: `scripts/smoke/`

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