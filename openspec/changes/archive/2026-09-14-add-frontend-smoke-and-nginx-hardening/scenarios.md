# Scenarios — add-frontend-smoke-and-nginx-hardening

> Validación de diseño: los endpoints de API referenciados existen en
> `docs/api/api-spec.yml` (`/health`, `/api/v1/products`, `/api/v1/categories`,
> `/api/v1/subcategories`). No introduce entidades nuevas del data model.

### SC-001: Smoke de API valida salud (AC para API)
**Given** el backend desplegado en un ambiente
**When** se ejecuta el smoke test de API
**Then** `GET /health` responde HTTP 200 con `status` saludable y `firebase` en `up`
**And** `/api/v1/products`, `/api/v1/categories` y `/api/v1/subcategories` responden 200 con array de datos

### SC-002: Smoke de Astro valida el sitio público
**Given** el sitio Astro desplegado en un ambiente
**When** se ejecuta el smoke test de Astro
**Then** `/` respond 200, `/productos` responde 200, existe al menos un producto publicado
**And** una ruta válida `/productos/{slug}` responde 200, y los recursos `/_astro/*` cargan correctamente

### SC-003: Smoke de Angular valida el panel (SPA)
**Given** el panel Angular desplegado en un ambiente
**When** se ejecuta el smoke test de Angular
**Then** `/` responde 200, una ruta interna directa usa el fallback SPA de Angular
**And** el contenido principal se renderiza y los archivos JS/CSS cargan

### SC-004: Smoke tests se disparan post-deploy con polling (CW-1)
**Given** un deploy de staging o producción
**When** el pipeline despliega frontends
**Then** los smoke tests de API + Astro + Angular del ambiente correspondiente se ejecutan tras el deploy
**And** como Coolify construye asíncomamente, el smoke de Astro/Angular reintenta (polling)
hasta que el deploy recién disparado esté vivo
**And** si algún smoke falla tras agotar el tiempo de espera, el deploy se marca como fallido

### SC-005: Smoke tests no-op si el entorno no está configurado
**Given** que la URL de smoke de un ambiente no está disponible (env var ausente)
**When** se ejecuta el smoke test de ese ambiente
**Then** el smoke se omite con aviso claro (no rompe el pipeline)
**And** no se intenta una conexión inválida

### SC-006: Nginx de web con caché correcta (AC9 §9)
**Given** la imagen de Astro desplegada con `nginx.conf`
**When** un cliente solicita recursos estáticos
**Then** los assets con hash (`/_astro/*`) se sirven con `Cache-Control: public, max-age=31536000, immutable`
**And** el HTML se sirve sin caché permanente (`no-cache` o `no-store` para index/html)
**And** las rutas desconocidas caen a la página 404 estática (404.html)

### SC-007: Nginx de admin con caché correcta (AC9 §9)
**Given** la imagen de Angular desplegada con `nginx.conf`
**When** un cliente solicita recursos
**Then** `index.html` se sirve sin caché permanente (`no-cache`)
**And** los assets con hash (`/assets/`) se sirven `immutable`
**And** las rutas internas usan el fallback SPA a `index.html`

### SC-008: Headers de seguridad en ambas apps (§9)
**Given** web o admin desplegados
**When** el servidor responde cualquier documento (incluido `index.html` servido por
el location propio o el SPA fallback)
**Then** incluye `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin` y la CSP base
**And** los security headers + CSP se repiten explícitamente en cada `location`
(nginx `add_header` no hereda si el location define uno propio), de modo que ningún
documento servido pierda los headers de seguridad

### SC-009: Rollback documentado (§10)
**Given** `docs/deploy-standards.md`
**When** un operador necesita revertir
**Then** encuentra: cómo identificar la última revisión sana, cómo volver a la
revisión anterior de Cloud Run, cómo redesplegar el commit previo en Coolify,
qué smoke ejecutar tras el rollback, y quién autoriza la promoción a producción

### SC-010: Migración de URLs provisionales→definitivas documentada
**Given** que aún no existen los dominios `somosriff.cl` (URLs temporales)
**When** se documenta en `docs/deploy-standards.md`
**Then** existe una sección con el checklist de migración: actualizar Build
Variables de Coolify (SITE_URL/NESTJS_API_URL), redeploy, actualizar CORS
(ASTRO_SITE_URL/ANGULAR_ADMIN_URL) en Cloud Run, y domain mapping de la API
(api.somosriff.cl)