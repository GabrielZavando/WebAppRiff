# Requirements — add-frontend-smoke-and-nginx-hardening

1. **R1 — Smoke API.** Script valida `GET /health` (200 + status ok + firebase up),
   `/api/v1/products`, `/api/v1/categories`, `/api/v1/subcategories` (200 + array).
   (SC-001)
2. **R2 — Smoke Astro.** Script valida home 200, `/productos` 200, ≥1 producto
   publicado, `/productos/{slug}` válido 200, y assets `/_astro/*` cargan.
   (SC-002)
3. **R3 — Smoke Angular.** Script valida `/` 200, SPA fallback en ruta interna,
   render de contenido y carga de JS/CSS. (SC-003)
4. **R4 — Hook post-deploy con polling.** `deploy.yml` ejecuta los smoke tests del
   ambiente correspondiente después del deploy de frontends, con **polling** sobre
   Astro/Angular (reintento hasta que el deploy asíncrono de Coolify esté vivo) o
   un timeout; el fallo marca el deploy como fallido. (SC-004)
5. **R5 — No-op por entorno no configurado.** Si la URL de smoke del ambiente
   falta, el script omite con aviso sin fallar. (SC-005)
6. **R6 — Nginx web caché.** `apps/web/nginx.conf`: `/_astro/*` inmutable (ya
   presente), HTML `no-cache`, 404 estática conservada. (SC-006)
7. **R7 — Nginx admin caché.** `apps/admin/nginx.conf`: `index.html` `no-cache`,
   `/assets/*` immutable, SPA fallback conservado. (SC-007)
8. **R8 — Headers de seguridad en todo documento.** Ambos nginx añaden
   `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y una CSP base
   compatible, repetidos explícitamente en **cada location** que defina
   `add_header` (para no perderlos por la semántica de herencia de nginx) — ningún
   HTML servido (incl. index.html/SPA fallback) carece de ellos. (SC-008)
9. **R9 — Rollback documentado.** `docs/deploy-standards.md` documenta identificación
   de revisión sana, reversión Cloud Run, redeploy Coolify del commit previo, smoke
   post-rollback y autorización de promoción. (SC-009)
10. **R10 — Migración URLs documentada.** Sección en `docs/deploy-standards.md` con
    el checklist de migración a dominios definitivos. (SC-010)