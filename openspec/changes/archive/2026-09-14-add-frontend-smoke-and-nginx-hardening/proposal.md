# Proposal: Add frontend smoke tests and harden nginx caching/security

- **Ticket ID**: RIFF-DEPLOY-01 (Change C del plan de despliegue)
- **Título original**: "[fullstack] Smoke tests + caché de Nginx + headers de seguridad + rollback"
- **Tag**: `[fullstack]`
- **Change name**: `add-frontend-smoke-and-nginx-hardening`

## Motivación

El pipeline de despliegue (Changes A/B) ahora despliega el backend en Cloud Run y
los frontends en Coolify, pero:

1. **No hay smoke tests automatizados de los frontends** en el post-deploy. El
   ticket (§8) exige validaciones mínimas de API (`/health` con `firebase:up`,
   products, categories, subcategories), Astro (home, `/productos`, ≥1 producto
   publicado, `/productos/{slug}`, assets `/_astro/*`), y Angular (root 200, SPA
   fallback en ruta interna, render, JS/CSS). Hoy `deploy.yml` solo fuma la API
   backend (health, products, categories, quotes) — no los dominios de los
   frontends.
2. **Nginx sin hardening de caché ni seguridad** (§9): el sitio web no marca HTML
   como no-cache y carece de headers de seguridad; el admin no marca `index.html`
   sin caché. Los assets con hash ya son inmutables en web, pero faltan
   `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
   `Content-Security-Policy` básica compatible en ambos.
3. **Rollback poco detallado** (§10): `docs/deploy-standards.md` solo menciona el
   comando de Cloud Run; faltan cómo identificar la última revisión sana, cómo
   redesplegar el commit previo en Coolify, qué smoke ejecutar tras el rollback y
   quién autoriza la promoción a producción. Falta además la sección de migración
   de URLs provisionales a definitivas cuando exista `somosriff.cl`.

## Decisión

1. **Smoke tests scripts**: añadir scripts reutilizables (p. ej. `scripts/smoke/`)
   que validen API + Astro + Angular contra URLs de ambiente, y hookearlos en
   `deploy.yml` tras los triggers de Coolify. Reutilizar las APIs del proyecto
   donde existan.
2. **Nginx hardening**: web y admin — HTML/index `no-cache`, assets `/assets/`
   (Angular) o `/_astro/` (web) inmutables, 404 estática (web) / SPA fallback
   (admin), y headers de seguridad compatibles con ambas.
3. **Docs rollback + URLs**: ampliar `deploy-standards.md` con el procedimiento de
   rollback completo y la sección de migración de URLs provisionales→definitivas.

## Alcance

- `apps/web/nginx.conf`, `apps/admin/nginx.conf` (hardening)
- Scripts de smoke tests (web/admin/api) y hooks en `.github/workflows/deploy.yml`
- `docs/deploy-standards.md` (rollback + sección URLs)

## Fuera de alcance

- Implementación funcional del panel Angular (placeholder).
- Migración del DNS `somosriff.cl` (ops).
- Provisión de secretos/coolify (ops).

## Riesgos

- Los smoke tests dependen de que los dominios/URLs existan; deben ser no-op o
  skip si el secret/env de URL no está (mismo patrón que los webhooks).
- Agregar headers de seguridad (p. ej. CSP) puede romper recursos externos si es
  estricta — se usará una CSP base compatible sin bloquear estilos/scripts
  inline necesarios.