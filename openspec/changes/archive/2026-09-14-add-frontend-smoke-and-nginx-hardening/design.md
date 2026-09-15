# Design — add-frontend-smoke-and-nginx-hardening

## Contexto

Pipeline (Changes A/B) despliega backend en Cloud Run y frontends en Coolify, pero
el post-deploy solo fuma la API backend. Falta validar los dominios Astro y Angular,
endurecer la política de caché/seguridad de nginx en web y admin, y detallar el
rollback y la migración de URLs provisionales→definitivas.

## Decisiones

### 1. Smoke tests scripts (`scripts/smoke/`)

Scripts bash/mjs independientes que llaman las URLs por env y son no-op si la URL
falta. Reutiliza el stack Node existente (mjs) para parsear respuestas.

- `smoke/api.*`: `SMOKE_API_URL` → `/health` (status ok + firebase up) + products +
  categories + subcategories.
- `smoke/web.*`: `SMOKE_WEB_URL` → home 200, `/productos` 200, ≥1 producto, un slug
  válido 200, un asset `/_astro/*`.
- `smoke/admin.*`: `SMOKE_ADMIN_URL` → `/` 200, ruta interna 200 (SPA fallback),
  marca `app-root`, assets `/assets/*`.

En `deploy.yml`, cada job de entorno pasa `SMOKE_API_URL` (URL Cloud Run) y
`SMOKE_WEB_URL`/`SMOKE_ADMIN_URL` (URLs de ambiente). El fallo de un smoke rompe el
job (sin `|| true`).

### 2. Hardening nginx

**Web** (`apps/web/nginx.conf`):
```nginx
location /_astro/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location = /index.html { add_header Cache-Control "no-cache"; }
location / {
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header Referrer-Policy "strict-origin-when-cross-origin";
  add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' https:; connect-src 'self' https:";
  try_files $uri $uri/ =404;
}
error_page 404 /404.html;
```

**Admin** (`apps/admin/nginx.conf`): mismos headers; `location ~* /assets/.*`
immutable; `index.html` no-cache; `try_files $uri /index.html` (SPA fallback).

La CSP es `'unsafe-inline'` para styles/scripts porque Astro y Angular inyectan
estilos/scripts inline necesarios (áginas de rendimiento/estado); `img-src` y
`connect-src` permiten la API (`https:`). Es una base compatible, anotada en docs
(no bloquear recursos propios).

### 3. Docs rollback + migración URLs

En `docs/deploy-standards.md`:
- § Rollback completa: identificar última revisión sana, `update-traffic` a
  `<previous>=100`, redeploy del commit previo en Coolify, smoke post-rollback,
  quién autoriza (Gabriel).
- § "URLs provisionales → definitivas": checklist de migración cuando `somosriff.cl`
  exista.

## Archivos clave

- `scripts/smoke/{api,web,admin}.*` (+ posibles tests)
- `.github/workflows/deploy.yml` (hooks)
- `apps/web/nginx.conf`, `apps/admin/nginx.conf`
- `docs/deploy-standards.md`

## Testing

- Scripts: validación de no-op con URL ausente y lógica de parseo (unit opcional).
- nginx: revisión estática (o `nginx -t` si está instalado).
- deploy.yml: YAML válido.
- Framework: check-refs + specboot en verde.