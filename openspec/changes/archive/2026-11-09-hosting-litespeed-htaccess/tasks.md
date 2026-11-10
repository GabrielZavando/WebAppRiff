## 1. Tests del contrato `.htaccess` del sitio público (TDD, tests primero)

- [x] 1.1 Crear el test en `apps/web` (p. ej. `apps/web/src/testing/__tests__/htaccess.test.ts`) con el caso fallido que exige que exista `apps/web/public/.htaccess` y que declare `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y la CSP base con `font-src 'self' https: data:`
- [x] 1.2 Añadir el caso fallido que exige el `.htaccess` anidado `apps/web/public/_astro/.htaccess` con la caché inmutable (`public, max-age=31536000, immutable`) para las extensiones de los assets con hash de Astro
- [x] 1.3 Añadir el caso fallido que exige en el `.htaccess` raíz `Cache-Control: no-cache` para el HTML y `ErrorDocument 404 /404.html`, y que NO exista fallback SPA (el sitio público es MPA)
- [x] 1.4 Añadir el caso fallido que comprueba que ningún `.htaccess` usa `Header ... env=` ni `SetEnvIf` para la caché, y que ninguno usa la directiva `Options`
- [x] 1.5 Añadir el caso de paridad con `apps/web/nginx.conf`: el string de `Content-Security-Policy` debe ser idéntico en ambos ficheros y ambos deben contener los valores `public, max-age=31536000, immutable` y `no-cache`
- [x] 1.6 Añadir el caso que, si existe `apps/web/dist/`, comprueba que el build contiene `.htaccess` en la raíz y `_astro/.htaccess` con el contenido esperado; si no hay build, se omite con un mensaje de skip que indique que la verificación real del `dist` se ejecuta con `npm run verify:htaccess`
- [x] 1.7 Ejecutar `npm run test --workspace=@riff/web` y confirmar que los casos nuevos fallan por la ausencia de los `.htaccess` (test rojo)
- [x] 1.8 Añadir el caso fallido que exige la redirección 301 de HTTP a HTTPS en `apps/web/public/.htaccess` (`RewriteCond %{HTTPS} !=on`, `RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]`) y el caso que exige que el path de desafío ACME quede excluido de la redirección
- [x] 1.9 Ajustar el caso de ausencia de fallback SPA para que siga exigiendo que no haya reescritura a `index.html` (la redirección HTTPS sí usa `RewriteRule`)
- [x] 1.10 Ejecutar `npm run test --workspace=@riff/web` y confirmar que los casos de redirección fallan antes de implementar la regla (test rojo)

## 2. Tests del contrato `.htaccess` del panel (TDD, tests primero)

- [x] 2.1 Crear el test en `apps/admin` con el caso fallido que exige que exista `apps/admin/src/.htaccess` con las mismas cabeceras de seguridad y la CSP base (`font-src 'self' https: data:`) que `apps/admin/nginx.conf`
- [x] 2.2 Añadir los casos fallidos de caché: `public, max-age=31536000, immutable` para `js`, `css`, `woff2` y `woff` (bundles en la raíz y fuentes en `media/`), `no-cache` para `index.html` y para el documento servido por el fallback SPA
- [x] 2.3 Añadir el caso fallido de fallback SPA (`RewriteEngine On`, condiciones `!-f` y `!-d`, `RewriteRule` a `/index.html`) y el caso que exige que el `.htaccess` no use `Header ... env=`/`SetEnvIf` ni la directiva `Options`
- [x] 2.4 Añadir el caso de paridad con `apps/admin/nginx.conf` (mismo string de CSP y presencia de los mismos valores de `Cache-Control`), documentando que la cobertura de la caché en `.htaccess` es más amplia que el patrón `/assets/*` del `nginx.conf`
- [x] 2.5 Añadir el caso que, si existe `apps/admin/dist/admin/browser/`, comprueba que el build contiene `.htaccess` en la raíz con el contenido esperado (omitido con `it.skip` y motivo explícito si no hay build)
- [x] 2.6 Ejecutar `npm run test --workspace=@riff/admin` y confirmar que los casos nuevos fallan por la ausencia de `apps/admin/src/.htaccess` (test rojo)
- [x] 2.7 Añadir el caso fallido que exige la redirección 301 de HTTP a HTTPS en `apps/admin/src/.htaccess` y que se evalúe **antes** del fallback SPA (la posición de la regla de redirección en el fichero debe ser anterior a la de `RewriteRule . /index.html`), más el caso que exige la exclusión del path de desafío ACME
- [x] 2.8 Ejecutar `npm run test --workspace=@riff/admin` y confirmar que los casos de redirección fallan antes de implementar la regla (test rojo)

## 3. Implementación de los `.htaccess` del sitio público

- [x] 3.1 Crear `apps/web/public/.htaccess` con `<IfModule mod_headers.c>` y `Header always set` para las cuatro cabeceras de seguridad y la CSP base idéntica a la de `apps/web/nginx.conf`
- [x] 3.2 Añadir al `.htaccess` raíz del sitio `Cache-Control: no-cache` para los documentos HTML (`<FilesMatch "\.html$">`) y `ErrorDocument 404 /404.html`, sin reglas de reescritura a `index.html` (MPA)
- [x] 3.3 Crear `apps/web/public/_astro/.htaccess` con la caché inmutable para las extensiones que emite Astro (css, js, mjs, woff/woff2, ttf, eot, svg, png, jpg/jpeg, webp, avif) mediante `<FilesMatch>`
- [x] 3.4 Verificar que ningún `.htaccess` usa la directiva `Options`, ni `Header ... env=` con `SetEnvIf`, y que los módulos (`mod_headers`, `mod_rewrite`) van envueltos en `IfModule`
- [x] 3.5 Ejecutar `npm run test --workspace=@riff/web` y confirmar que los tests del grupo 1 pasan (test verde)
- [x] 3.6 Añadir al `.htaccess` raíz del sitio la redirección 301 de HTTP a HTTPS con `mod_rewrite` dentro de `<IfModule mod_rewrite.c>`: `RewriteCond %{HTTPS} !=on`, `RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/` y `RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]`, sin `Options` ni `env=`
- [x] 3.7 Ejecutar `npm run test --workspace=@riff/web` y confirmar que los tests del grupo 1 pasan con la redirección implementada (test verde)

## 4. Publicación y verificación del `.htaccess` del sitio público

- [x] 4.1 Ejecutar `npm run build --workspace=@riff/web` y comprobar que `apps/web/dist/.htaccess` y `apps/web/dist/_astro/.htaccess` existen en el output, conviviendo con los assets con hash de Astro (si el merge de `public/_astro/` con el directorio de assets	resultara problemático, aplicar el plan B del design: declarar la caché inmutable por extensión en el `.htaccess` raíz)
- [x] 4.2 Crear `apps/web/scripts/verify-htaccess.mjs` que valide, contra un build existente, que `.htaccess` y `_astro/.htaccess` están en el output y cumplen el contrato (cabeceras, CSP, caché, `ErrorDocument`), con mensaje de error explícito
- [x] 4.3 Exponer el script como comando npm independiente (`npm run verify:htaccess --workspace=@riff/web`), **sin** engancharlo como hook `pre`/`post` de `build`
- [x] 4.4 Ejecutar `npm run verify:htaccess --workspace=@riff/web` y confirmar que pasa contra el build del punto 4.1
- [x] 4.5 Confirmar que `apps/web/package.json` no tiene ningún hook `pre`/`post` de `build` que dependa de ficheros fuera de `package.json`, `src/` y `public/` (los únicos copiados por `apps/web/Dockerfile`)

## 5. Implementación y publicación del `.htaccess` del panel

- [x] 5.1 Crear `apps/admin/src/.htaccess` con `<IfModule mod_headers.c>` y `Header always set` para las cuatro cabeceras de seguridad y la CSP base idéntica a la de `apps/admin/nginx.conf`
- [x] 5.2 Añadir al `.htaccess` del panel la caché inmutable por extensión (`js`, `css`, `woff2`, `woff`) mediante `<FilesMatch>` y `Cache-Control: no-cache` para `*.html`
- [x] 5.3 Añadir el fallback SPA (`RewriteEngine On`, `!-f`, `!-d`, `RewriteRule` a `/index.html`) envuelto en `<IfModule mod_rewrite.c>`
- [x] 5.4 Modificar `apps/admin/angular.json` (fichero existente) añadiendo a `assets` la entrada `{ "glob": ".htaccess", "input": "src", "output": "/" }`
- [x] 5.5 Ejecutar `npm run build --workspace=@riff/admin` y comprobar que `apps/admin/dist/admin/browser/.htaccess` existe en la raíz del output
- [x] 5.6 Crear `apps/admin/scripts/verify-htaccess.mjs` con la misma validación de contrato que en web, exponiéndolo como `npm run verify:htaccess --workspace=@riff/admin` sin engancharlo al `build`, y ejecutarlo contra el build del punto 5.5
- [x] 5.7 Ejecutar `npm run test --workspace=@riff/admin` y confirmar que todos los tests pasan
- [x] 5.8 Añadir al `.htaccess` del panel la redirección 301 de HTTP a HTTPS con `mod_rewrite` dentro de `<IfModule mod_rewrite.c>`, declarada **antes** del bloque del fallback SPA, excluyendo el path de desafío ACME y sin `Options` ni `env=`
- [x] 5.9 Actualizar `apps/admin/scripts/verify-htaccess.mjs` para exigir la redirección 301 y que su posición sea anterior al fallback SPA, y actualizar `apps/web/scripts/verify-htaccess.mjs` para exigir la redirección y seguir prohibiendo el fallback SPA en el sitio público
- [x] 5.10 Ejecutar `npm run test --workspace=@riff/admin`, `npm run verify:htaccess --workspace=@riff/admin` y `npm run verify:htaccess --workspace=@riff/web` y confirmar que todo pasa

## 6. Página `404` del sitio público (TDD, test primero)

- [x] 6.1 Crear el test fallido que comprueba que existe `apps/web/src/pages/404.astro` y que usa el `Layout` del sitio (`@/layouts/Layout.astro`) con un enlace al home
- [x] 6.2 Crear `apps/web/src/pages/404.astro` reutilizando `@/layouts/Layout.astro` con un mensaje breve, un enlace al home y los tokens de diseño del sitio, sin dependencias ni assets nuevos
- [x] 6.3 Ejecutar `npm run build --workspace=@riff/web` y confirmar que `apps/web/dist/404.html` existe y contiene el mensaje y el enlace al home
- [x] 6.4 Ejecutar `npm run test --workspace=@riff/web` y confirmar que todos los tests pasan

## 7. Gates de calidad del repositorio

- [x] 7.1 Ejecutar `make lint` y corregir los errores introducidos por el change
- [x] 7.2 Ejecutar `make test` y confirmar que la suite completa pasa
- [x] 7.3 Ejecutar `make typecheck` y confirmar que no hay errores de tipado
- [x] 7.4 Ejecutar `make docker-build` y confirmar que el carril Docker sigue construyéndose: los Dockerfiles, `apps/web/nginx.conf` y `apps/admin/nginx.conf` no se han tocado y ningún hook de build depende de ficheros ausentes del contexto de imagen
- [x] 7.5 Ejecutar `npx openspec validate --all --strict` y confirmar que el change y la spec delta son válidos
- [x] 7.6 Ejecutar la verificación del `dist` inmediatamente después del build y dentro del orden real de `make ci` (`openspec-validate` → `lint` → `typecheck` → `build` → `test-ci` → `audit`; el build ocurre **antes** que los tests): `npm run verify:htaccess --workspace=@riff/web` y `npm run verify:htaccess --workspace=@riff/admin`, confirmando que ambas pasan contra los `dist/` recién generados
- [x] 7.7 Confirmar con el usuario si la verificación debe quedar encadenada de forma permanente en el target `ci` del `Makefile` (implicaría añadir un target `verify-htaccess` y modificar el `Makefile`, que en este change está declarado fuera de alcance); si se aprueba, añadir el target y el paso al `ci` y re-ejecutar `make ci`
- [x] 7.8 Añadir al `Makefile` el target `verify-htaccess` (ejecuta `npm run verify:htaccess` en web y admin) y encadenarlo en `ci` entre `build` y `test-ci`, sin tocar ningún otro target (incluido `docker-build`)
- [x] 7.9 Ejecutar `make ci` completo (openspec-validate → lint → typecheck → build → verify-htaccess → test-ci → audit) y confirmar que todo pasa, y re-ejecutar `npx openspec validate --all --strict`
- [x] 7.10 Re-ejecutar `make ci` y `npx openspec validate --all --strict` tras el cambio de alcance de la redirección HTTPS (grupos 1, 2, 3, 5 y 8 actualizados)

## 8. Verificación empírica en el hosting LiteSpeed (operador)

> Ejecutada en staging (`staging.somosriff.cl` y `admin-staging.somosriff.cl`). Resultados registrados en la sección "Verificación empírica en el hosting" del `design.md`.

- [x] 8.1 Preparar el paquete de prueba desde el `dist/` del sitio público: el `.htaccess` raíz, el `.htaccess` de `_astro/`, el `404.html` y al menos un asset real con hash de `dist/_astro/` (p. ej. un `.css` o un `.woff2`)
- [x] 8.2 Preparar el paquete de prueba desde el `dist/` del panel: el `.htaccess` raíz, un bundle real con hash (p. ej. `chunk-*.js`) y una fuente real de `media/` (`.woff2`)
- [x] 8.3 Subir por FTP el paquete del sitio público a la raíz del subdominio, confirmando que la raíz de la cuenta FTP es la raíz de documentos, y replicar la estructura `_astro/` (carpeta con el asset y su `.htaccess`)
- [x] 8.4 Ejecutar `curl -I` (por HTTPS) contra la home del sitio público y comprobar `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy` (con `font-src 'self' https: data:`) y `Cache-Control: no-cache`
- [x] 8.5 Ejecutar `curl -I` contra el asset real subido en `_astro/` y comprobar `Cache-Control: public, max-age=31536000, immutable`
- [x] 8.6 Ejecutar `curl -I` contra una ruta inexistente del sitio público y comprobar que responde `404` sirviendo el `404.html` subido
- [x] 8.7 Repetir las comprobaciones 8.4–8.6 (por HTTPS) adaptadas al panel (adaptadas: el panel es SPA, así que la ruta profunda devuelve `index.html` con `no-cache`): cabeceras, caché inmutable del bundle y de la fuente, y fallback SPA
- [x] 8.8 Si el `.htaccess` no se aplica, revisar el error log de cPanel/LiteSpeed con este checklist (no fue necesario: el `.htaccess` se aplicó correctamente en ambos subdominios): (a) `Options not allowed here` o `AllowOverride` insuficiente — el `.htaccess` no usa `Options`, la corrección es del hosting; (b) `mod_headers`/`mod_rewrite` no cargados — los `IfModule` evitan el 500 pero las cabeceras no se aplican; (c) errores de reescritura o `RewriteRule` no permitido; (d) respuestas `500` tras subir el `.htaccess` — anotar la línea exacta del log y la directiva a corregir; (e) bucle de redirección o error de TLS tras el 301 — el certificado no está emitido o activo en cPanel (tarea 8.10)
- [x] 8.9 Registrar el resultado de la verificación (headers observados, `Cache-Control` de cada ruta y entradas relevantes del error log) como parte de la entrega del change (registrado en la sección "Verificación empírica en el hosting" del design.md)
- [x] 8.10 Confirmar con el cliente que el certificado TLS está emitido y activo en el cPanel (AutoSSL / Let's Encrypt) — verificado en staging (la redirección 301 lleva a una URL HTTPS que responde `200`, sin bucle); la redirección 301 HTTP→HTTPS ya está declarada en los `.htaccess` del repositorio, por lo que sin certificado activo el hosting respondería con un error de TLS tras el 301
- [x] 8.11 Ejecutar `curl -I http://<subdominio>/` en el sitio público y en el panel y comprobar que responden `301` con `Location: https://<mismo-host><misma-ruta>`, y que una ruta profunda del panel también se redirige (no se sirve como `index.html`) — verificado en staging
