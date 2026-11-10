## Why

El hosting compartido del cliente (cPanel con LiteSpeed) no puede usar los `nginx.conf` que hoy definen la política de caché y las cabeceras de seguridad: LiteSpeed no los interpreta. Sin un `.htaccess` equivalente, el sitio público y el panel servidos en ese hosting quedan sin `Content-Security-Policy`, sin `X-Frame-Options`, sin `X-Content-Type-Options`, sin `Referrer-Policy` y sin la política de caché diferenciada (assets inmutables vs. HTML `no-cache`). Además, el build de Astro no genera `404.html`, por lo que el hosting LiteSpeed no tiene página 404 propia y el error de nginx (`error_page 404 /404.html`) no tiene equivalente posible.

## What Changes

- Se añade un `.htaccess` raíz para el sitio público Astro (`apps/web/public/.htaccess`) equivalente al `apps/web/nginx.conf`: cabeceras de seguridad y CSP base en todos los documentos, `Cache-Control: no-cache` para el HTML y `ErrorDocument 404 /404.html`, sin fallback SPA (el sitio público es un MPA).
- Se añade un `.htaccess` anidado en `apps/web/public/_astro/.htaccess` para aplicar la caché inmutable (`public, max-age=31536000, immutable`) exclusivamente a los assets con hash que Astro emite en `/_astro/`.
- Se añade un `.htaccess` raíz para el panel Angular (`apps/admin/src/.htaccess`) equivalente a `apps/admin/nginx.conf`: cabeceras de seguridad y CSP base, `no-cache` para el HTML y fallback SPA a `index.html`.
- La caché del panel en `.htaccess` se define sobre la estructura real del build de Angular (bundles `chunk-*.js` y `styles-*.css` en la raíz y fuentes `media/*.woff2`), que es una mejora respecto al `nginx.conf`, cuyo patrón `/assets/*` no cubre los bundles reales.
- Se modifica `apps/admin/angular.json` (fichero existente) para publicar `src/.htaccess` en la raíz del build mediante una entrada de `assets` con glob literal `.htaccess`.
- Se añade al `Makefile` un target `verify-htaccess` que ejecuta la verificación del `dist/` en web y admin, encadenado en el gate `make ci` entre `build` y `test-ci`; ningún otro target del `Makefile` se modifica.
- Se añade a ambos `.htaccess` (web y admin) una redirección 301 de HTTP a HTTPS con `mod_rewrite`, evaluada antes del fallback SPA en el panel: la redirección vive en el repositorio porque una regla activada desde cPanel se perdería al sobrescribir el `.htaccess` en cada despliegue.
- Se define que el `.htaccess` es la fuente de verdad del contrato de cabeceras en el hosting LiteSpeed, y que los `nginx.conf` y los Dockerfiles permanecen sin cambios (`make docker-build` se mantiene intacto y sin hooks de build nuevos).
- Se añaden tests automatizados que verifican el contrato del `.htaccess` (cabeceras, CSP, caché, 404/SPA) y su presencia en el `dist/` cuando existe un build, más un script npm de verificación independiente que no se engancha al build.
- Se crea una página `404.astro` mínima en el sitio público, alineada con el contrato de `404` en hosting LiteSpeed.
- Se documenta la verificación empírica del `.htaccess` en el hosting real (`.htaccess` de prueba + `curl -I` sobre un asset real y sobre la página 404) y qué revisar en el error log de LiteSpeed/cPanel cuando el `.htaccess` no se aplica.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `add-frontend-smoke-and-nginx-hardening`: se modifica el requirement "Nginx SHALL enforce cache policy and security headers" para incorporar el contrato equivalente en `.htaccess` para hosting LiteSpeed (sitio público y panel) como fuente de verdad del contrato de cabeceras en ese hosting, manteniendo `nginx.conf` y Dockerfiles sin tocar, y para registrar la política de caché real del panel como mejora respecto al patrón `/assets/*` del `nginx.conf`; y se añade el requirement de la redirección canónica 301 de HTTP a HTTPS declarada en los `.htaccess`.

## Impact

- `apps/web/public/.htaccess` (nuevo), `apps/web/public/_astro/.htaccess` (nuevo) y `apps/web/src/pages/404.astro` (nuevo).
- `apps/admin/src/.htaccess` (nuevo) y `apps/admin/angular.json` (existente; se modifica para añadir la entrada de assets que publica el `.htaccess` en la raíz del build).
- Tests nuevos en `apps/web` y `apps/admin` (contrato del `.htaccess`, paridad con `nginx.conf` y presencia en el `dist/` cuando existe build) y un script npm de verificación del `dist/` en cada app (no enganchado al build).
- `Makefile` (existente): nuevo target `verify-htaccess` encadenado en el gate `ci` entre `build` y `test-ci`.
- Specs: `openspec/specs/add-frontend-smoke-and-nginx-hardening/spec.md` (delta).
- No se tocan `apps/web/nginx.conf`, `apps/admin/nginx.conf`, los Dockerfiles, el backend, los workflows de GitHub Actions ni la infraestructura de Coolify, y no se añaden hooks `pre`/`post` al script `build` de ninguna app. El `Makefile` sólo se modifica para añadir el target `verify-htaccess` y encadenarlo en `ci`.
- Fuera de alcance (ciclos posteriores): workflows de GitHub Actions, subida por FTP, cambios en el backend, limpieza de Coolify o Docker, y la emisión/activación del certificado TLS (que se realiza desde el cPanel del cliente).
