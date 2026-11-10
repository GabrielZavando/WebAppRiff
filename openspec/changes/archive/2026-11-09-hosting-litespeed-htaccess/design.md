## Context

El proyecto se despliega hoy en dos carriles: contenedores con nginx (Coolify/Cloud Run) y, de forma creciente, hosting compartido del cliente en cPanel con LiteSpeed. En el carril LiteSpeed no existe nginx: el servidor es LiteSpeed y el único mecanismo de configuración por directorio es `.htaccess`. El contrato actual de caché y cabeceras de seguridad vive únicamente en `apps/web/nginx.conf` y `apps/admin/nginx.conf`, por lo que en el hosting compartido el sitio público y el panel se sirven sin CSP, sin `X-Frame-Options`, sin `X-Content-Type-Options`, sin `Referrer-Policy` y con la caché por defecto del servidor (HTML cacheable, assets no inmutables).

Restricciones fijadas por el cliente en este ciclo:

- El home de la cuenta FTP de cada subdominio cae directamente en la raíz de documentos del subdominio, de modo que el `.htaccess` sólo tiene efecto si se entrega en esa raíz.
- `apps/web/nginx.conf`, `apps/admin/nginx.conf` y los Dockerfiles no se tocan. `make docker-build` se mantiene. En el hosting LiteSpeed el `.htaccess` es la fuente de verdad del contrato de cabeceras.
- El panel es una SPA Angular; el sitio público es un MPA Astro. Cada `.htaccess` replica el comportamiento del `nginx.conf` correspondiente: fallback SPA en admin, `error_page 404 /404.html` en web (que hoy no tiene equivalente, porque Astro no genera `404.html` al no existir `404.astro`).
- Fuera de alcance: workflows de GitHub Actions, subida por FTP, backend, limpieza de Coolify o Docker y la emisión/activación del certificado TLS.

Hechos verificados en el repositorio (base de esta decisión, no supuestos):

- `apps/web/Dockerfile:76-80` copia al contexto de build `apps/web/package.json`, `tsconfig.json`, `astro.config.mjs`, `src/` y `public/`. **No** copia `apps/web/scripts/`. Como `npm run build` ejecuta automáticamente el hook `postbuild` si existe, cualquier hook de build que invoque un script fuera de `src/`, `public/` o `package.json` **rompe** `make docker-build`.
- `apps/admin/Dockerfile:76-78` copia `apps/admin/scripts/` y `apps/admin/src/`, de modo que un hook de build sí sería viable en admin; pero se aplica el mismo criterio en ambas apps por simetría y por minimise de acoplamiento.
- Astro 7 delega la copia de `public/` en Vite (`node_modules/astro/dist/core/build/vite-build-config.js:126`, `copyPublicDir: true`) y la implementación de Vite (`node_modules/vite/dist/node/chunks/node.js:2381`, `copyDir`) usa `readdirSync` + `copyFileSync`, es decir **copia también los dotfiles**.
- Angular 22 resuelve los assets con `tinyglobby` y `dot: true` (`node_modules/@angular/build/src/utils/resolve-assets.js:29-31`), por lo que un glob literal `.htaccess` **sí** encuentra el fichero.
- Layout real del build de producción del panel (`apps/admin/dist/admin/browser/`): los bundles con hash (`chunk-*.js`) y la hoja de estilos (`styles-*.css`) están en la **raíz**, las fuentes con hash en `media/*.woff2|woff` y las imágenes en `assets/img/`. El `nginx.conf` del panel sólo cachea `/assets/*`, es decir que **no cubre los bundles reales**.
- Layout real del build del sitio público: los assets con hash de Astro están en `dist/_astro/`; en la raíz del output sólo viven los ficheros estáticos publicados (`logo_riff.png`, `og-image.png`).
- Tests: Vitest en ambos workspaces (`apps/web/vitest.config.ts` incluye `src/**/*.test.ts`; `apps/admin` equivalente) y E2E con Playwright.
- Hechos verificados en el hosting real (2026-11): `http://staging.somosriff.cl` respondía `200` sin redirigir a HTTPS, y el `.htaccess` que ya había en el hosting sólo contenía configuración de PHP de cPanel (sin redirecciones). Como cada despliegue sobrescribe el `.htaccess` de la raíz del subdominio, cualquier redirección configurada desde el panel de cPanel se perdería: la redirección 301 HTTP→HTTPS se declara, por tanto, en el `.htaccess` del repositorio (D7).

## Goals / Non-Goals

**Goals:**

- Expresar en `.htaccess` el mismo contrato de cabeceras de seguridad y CSP que define cada `nginx.conf`, para el sitio público y para el panel.
- Aplicar una política de caché que se corresponda con la estructura real del build de cada app (no con las rutas supuestas por el `nginx.conf`).
- Entregar el `.htaccess` en la raíz del `dist/` de cada app usando exclusivamente mecanismos presentes en el contexto de build de Docker, sin tocar los Dockerfiles ni añadir hooks al script `build`.
- Añadir una página `404.astro` mínima que Astro genere como `dist/404.html`, para que el hosting pueda servir la página de error.
- Verificar la aplicabilidad real del `.htaccess` en el hosting (con un asset real y la página 404) y dejar documentado qué revisar en el error log de cPanel/LiteSpeed cuando no se aplica.
- Mantener `nginx.conf` y los Dockerfiles intactos, sin romper `make docker-build`.

**Non-Goals:**

- Publicar por FTP, automatizar la subida o definir credenciales/hosts: es un ciclo posterior.
- Añadir workflows de GitHub Actions para el despliegue al hosting.
- Tocar el backend, la API, la base de datos o la infraestructura de Coolify/Docker.
- Activar el certificado TLS (AutoSSL / Let's Encrypt) desde el cPanel del cliente: queda pendiente de confirmación, pero la redirección HTTP→HTTPS sí forma parte del `.htaccess` del repositorio (D7).
- Endurecer el panel más allá del contrato ya definido en `nginx.conf` (autenticación HTTP de cPanel, restricciones por IP).
- Introducir un módulo de configuración de cabeceras compartido entre `nginx.conf` y `.htaccess`: la equivalencia se protege con tests de paridad.

## Decisions

### D1 — Sin hooks de build: la entrega del `.htaccess` usa `public/` (web) y `assets` (admin)

El `.htaccess` de cada app se entrega sin tocar los Dockerfiles y sin añadir `pre`/`post` al script `build`:

- **Sitio público**: `apps/web/public/.htaccess` (raíz del documento) y `apps/web/public/_astro/.htaccess` (assets con hash). Astro copia `public/` al `dist/` a través de Vite, que incluye los dotfiles (verificado en D-facts). El Dockerfile ya copia `apps/web/public`, así que el fichero está disponible en el build de imagen sin cambios.
- **Panel**: `apps/admin/src/.htaccess`, publicado en la raíz del output mediante una entrada de `assets` en `apps/admin/angular.json`: `{ "glob": ".htaccess", "input": "src", "output": "/" }`. Angular resuelve los assets con `tinyglobby` y `dot: true`, por lo que el glob literal encuentra el dotfile; el Dockerfile ya copia `apps/admin/src`.

Alternativas descartadas:

- *`postbuild` con un script `scripts/copy-htaccess.mjs`*: en web **rompe** `make docker-build`, porque el Dockerfile no copia `apps/web/scripts/` y el hook `postbuild` se ejecuta siempre dentro del build de Docker. Descartado.
- *`astro:build:done` hook en `astro.config.mjs`*: técnicamente viable (el Dockerfile copia `astro.config.mjs`), pero añade lógica de build no trivial para un fichero estático y suma una segunda fuente de verdad del `.htaccess`. Descartado.
- *`.htaccess` en `apps/admin/` con copia manual*: no llega al `dist/` sin un paso de build. Descartado.

Consecuencia aceptada: el `dist/` del carril Docker contiene ahora ficheros `.htaccess` que nginx sirve como ficheros estáticos si se piden. No se puede evitar sin tocar los Dockerfiles (prohibido en este ciclo); queda como candidato a limpieza en un ciclo posterior (`location ~ /\.htaccess { deny all; }` o `.dockerignore`).

### D2 — La verificación del contrato sale del build

Como el build no puede depender de hooks (D1), la verificación del contrato vive en dos sitios, ambos fuera del build:

1. **Test de Vitest** por app: valida el contenido del `.htaccess` (cabeceras, CSP, caché, regla 404/SPA) y la paridad con el `nginx.conf`; además, si existe un `dist/` en el workspace, valida que el `.htaccess` está en la raíz del output con el contenido esperado. Si no hay build, esa parte se omite (`it.skip` con motivo explícito), de modo que la suite unitaria no depende de un build (que en web además depende de la API para el catálogo).
2. **Script npm de verificación** por app (`npm run verify:htaccess`): valida el contrato contra un build existente y falla con un mensaje explícito. No es un hook de lifecycle (`pre`/`post`), por lo que no se ejecuta durante `npm run build` ni dentro del build de Docker; se invoca a demanda (`npm run verify:htaccess --workspace=@riff/web`) o desde el pipeline cuando se use en un ciclo posterior.

El `Makefile` entra en el alcance de este change **únicamente** para añadir el target `verify-htaccess` y encadenarlo en el gate `ci` entre `build` y `test-ci`; ningún otro target (incluido `docker-build`) se modifica. El orden real del gate `make ci` es `openspec-validate` → `lint` → `typecheck` → `build` → `verify-htaccess` → `test-ci` → `audit` (`Makefile:64`), es decir **el build ocurre antes que los tests**: por eso la verificación del `dist` con `npm run verify:htaccess` se ejecuta en el hueco entre el build y `test-ci`, y los casos de Vitest que leen el `dist/` (tasks 1.6 y 2.5) ya encuentran un build presente cuando corre la suite dentro del gate.

### D3 — Política de caché real: `_astro/.htaccess` en web, `FilesMatch` por extensión en admin

- **Web**: la caché inmutable se declara en un `.htaccess` **dentro de `dist/_astro/`**, con `<FilesMatch>` sobre las extensiones que emite Astro (css, js, mjs, woff/woff2, ttf, eot, svg, png, jpg/jpeg, webp, avif). Así la regla aplica exactamente a la ruta de los assets con hash y no toca los ficheros estáticos de la raíz (`logo_riff.png`, `og-image.png`). El `.htaccess` raíz se ocupa de las cabeceras de seguridad, del `no-cache` del HTML y del `ErrorDocument 404 /404.html`.
- **Admin**: los bundles con hash están en la raíz del output y las fuentes en `media/`, así que la caché inmutable se declara por extensión con `<FilesMatch>` sobre `js`, `css`, `woff2` y `woff`, y el `no-cache` con `<FilesMatch "\.html$">`. El `.htaccess` raíz del panel incluye además el fallback SPA a `index.html`.

Esta política es **más efectiva** que la del `nginx.conf` del panel (que sólo cubre `/assets/*` y por tanto no cachea los bundles reales). La divergencia se registra en la spec como mejora del contrato LiteSpeed, no como discrepancia. Las imágenes (`logo_riff.png` en la raíz, `assets/img/*`) quedan deliberadamente fuera de la regla inmutable para que puedan actualizarse sin invalidación de caché; su caché es la que imponga el servidor por defecto.

### D4 — Sintaxis LiteSpeed: `IfModule`, sin `Options`, sin `env=`/`SetEnvIf`

- Las cabeceras se declaran con `<IfModule mod_headers.c>` y `Header always set` para `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y la CSP base (mismo string que el `nginx.conf`). El `always` replica nginx: las cabeceras también en respuestas de error.
- **No se usa la directiva `Options`** (ni `-Indexes` ni `+FollowSymLinks`): es la causa clásica de `500 Internal Server Error` cuando el hosting tiene `AllowOverride` sin `Options`, y LiteSpeed lo registra en el error log.
- **No se usa `Header ... env=` con `SetEnvIf`**: el alcance por ruta se resuelve con el `.htaccess` anidado en `_astro/` (web) y con `FilesMatch` por extensión (admin). Así el `.htaccess` no depende de `mod_setenvif` y no arrastra variables de entorno entre peticiones.
- Todo lo que depende de un módulo va envuelto en `IfModule` para que su ausencia no provoque un 500; el precio es que la ausencia de módulo pasa inadvertida, y por eso se exige la verificación empírica (D6).

### D5 — Página `404` mínima alineada con el sitio público

Se crea `apps/web/src/pages/404.astro`, que Astro convierte en `dist/404.html` (Astro genera la página 404 estática a partir de `src/pages/404.astro`; no requiere ningún script de build, por lo que es compatible con el Dockerfile sin cambios). La página reutiliza `@/layouts/Layout.astro` —el mismo layout, header, footer y tokens de diseño que el resto del sitio— con un mensaje breve y un enlace al home, sin dependencias ni assets nuevos. No se replica el diseño visual completo de las páginas de contenido: la prioridad es que el documento exista, responda 404 y no rompa el contrato visual.

### D6 — Verificación empírica en el hosting, con assets reales

La verificación en cPanel/LiteSpeed no puede consistir en subir sólo el `.htaccess`: sin ficheros reales en el hosting no hay forma de observar la caché ni la página 404. El procedimiento documentado sube a la raíz del subdominio:

- el `.htaccess` raíz y, en el sitio público, el `.htaccess` de `_astro/`,
- al menos un asset con hash real extraído del `dist/` (por ejemplo un `*.css` o `*.woff2` de `dist/_astro/` en web, y un `chunk-*.js` en el panel),
- el `404.html` generado por el build del sitio público,

y a continuación ejecuta `curl -I` contra el documento, contra el asset con hash y contra una ruta inexistente, comparando `Cache-Control`, las cuatro cabeceras de seguridad y la CSP con los valores esperados. La misma comprobación se hace **sobre HTTP** (`curl -I http://<subdominio>/`), donde se espera un `301` con `Location: https://<mismo-host><misma-ruta>`, y se repite sobre una ruta profunda del panel para confirmar que la redirección se evalúa antes del fallback SPA. Si el `.htaccess` no se aplica, se busca en el error log de cPanel/LiteSpeed con el checklist: (a) `Options not allowed here` o `AllowOverride` insuficiente — el `.htaccess` no usa `Options`, así que la corrección es del hosting; (b) `mod_headers`/`mod_rewrite` no cargados — los `IfModule` evitan el 500 pero las cabeceras no se aplican; (c) errores de reescritura o `RewriteRule` no permitido; (d) respuestas `500` inmediatamente tras subir el `.htaccess` — anotar la línea exacta del log y la directiva a corregir; (e) bucle de redirección o error de TLS — el certificado no está emitido o activo en cPanel. La capa empírica es manual: la subida por FTP está fuera de alcance en este ciclo.

### D7 — Redirección canónica 301 HTTP→HTTPS dentro del `.htaccess`

Los `.htaccess` de web y panel declaran la redirección con `mod_rewrite`, envuelta en `<IfModule mod_rewrite.c>`:

```
RewriteCond %{HTTPS} !=on
RewriteCond %{REQUEST_URI} !^/\.well-known/acme-challenge/
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
```

Razones:

- **El repositorio es la fuente de verdad.** Una redirección configurada en el panel de cPanel se pierde en cuanto un despliegue sobrescribe el `.htaccess` de la raíz del subdominio (hecho verificado en el staging: el hosting respondía `200` por HTTP y su `.htaccess` sólo traía configuración de PHP de cPanel). Declararla en el repo la hace idempotente frente a los despliegues.
- **Compatible con LiteSpeed.** `mod_rewrite` con `%{HTTPS}`, `%{HTTP_HOST}` y `%{REQUEST_URI}` es soportado por LiteSpeed; se evita `Options` y `env=` (D4).
- **El path del desafío ACME queda excluido** (`/.well-known/acme-challenge/`), para que la renovación del certificado no falle si la redirección se activa antes de que el certificado esté emitido.
- **Orden en el panel**: en el `.htaccess` del admin la redirección se declara **antes** del fallback SPA, de modo que un deep link solicitado por HTTP responde `301` en lugar de servirse como `index.html`. Las reglas se procesan en orden y la redirección termina con `[L]`, por lo que el fallback sólo actúa cuando la petición ya es HTTPS.

Alternativas descartadas:

- *Redirección configurada desde cPanel*: se pierde en cada despliegue (motivo principal del cambio de alcance).
- *Redirección en JavaScript o en el HTML*: no cubre assets, ni robots, ni peticiones que no ejecutan JS, y produce una señal SEO peor que un 301.
- *TLS con redirección forzada por el servidor (LiteSpeed "HTTPS only")*: depende de una configuración del panel que tampoco sobreviviría al despliegue, y su comportamiento puede diferir entre subdominios.

Consecuencia: sobrescribir el `.htaccess` del hosting elimina la configuración de PHP de cPanel que había allí. Los frontends son estáticos (Astro SSG y Angular SPA) y no ejecutan PHP, por lo que esa configuración no es necesaria; si el cliente necesitara PHP en el futuro, tendría que declararse también en los `.htaccess` del repositorio.

### D8 — El `.htaccess` es la fuente de verdad del contrato de cabeceras en el hosting

Se registra explícitamente en el delta de la spec `add-frontend-smoke-and-nginx-hardening` que, para el hosting LiteSpeed, el `.htaccess` es la fuente de verdad del contrato de cabeceras y caché, mientras que `nginx.conf` lo sigue siendo para el carril Docker. Ambos contratos se mantienen equivalentes en cabeceras y CSP mediante los tests de paridad, y la política de caché del panel en `.htaccess` es deliberadamente más amplia que la de su `nginx.conf`. Ningún `nginx.conf` ni Dockerfile se modifica.

## Risks / Trade-offs

- [El `.htaccess` dentro de `public/_astro/` colisiona con el directorio de assets que Astro emite en `dist/_astro/`] → Vite copia `public/` **después** de emitir el bundle y su `copyDir` fusiona sin borrar (`node_modules/vite/dist/node/chunks/node.js:2381`), de modo que el `.htaccess` convive con los assets con hash; queda una task explícita de verificación empírica del resultado en el `dist/`. Si en la práctica el merge resultara problemático, el plan B es declarar la caché inmutable por extensión en el `.htaccess` raíz del sitio (el `dist/` del sitio no tiene `.js`/`.css` sueltos en la raíz), sin tocar Dockerfiles.
- [Vite podría avisar o resolver de forma distinta los ficheros de `public/` que coinciden con rutas generadas] → se verifica el log del build y el contenido del `dist/` en la task de entrega; el aviso, si existe, es informativo y no rompe el build.
- [La entrada de `assets` de `angular.json` es una modificación de un fichero de configuración del build] → es el mecanismo soportado por Angular para publicar ficheros estáticos y no altera el resto del pipeline (el favicon ya se publica igual).
- [El host ignora el `.htaccess` (`AllowOverride None`) o no tiene `mod_headers`/`mod_rewrite`] → las directivas sensibles van envueltas en `IfModule` para no provocar 500; la verificación empírica con `curl -I` y el checklist del error log detectan el caso; si el host lo bloquea, la alternativa (configuración del host) queda fuera de este ciclo y se trataría con el proveedor.
- [Usar `Options` provocaría `500` en el hosting] → decisión explícita de no usar la directiva; queda anotado en el checklist del error log.
- [Deriva entre `.htaccess` y `nginx.conf` con el paso del tiempo] → tests de paridad que comparan el string de CSP y los valores de `Cache-Control` presentes en ambos ficheros.
- [El `dist/` del carril Docker contiene `.htaccess` y nginx podría servirlo como fichero estático] → aceptado por la restricción de no tocar los Dockerfiles; queda documentado como candidato a limpieza en un ciclo posterior.
- [La CSP en `.htaccess` requiere escaping de comillas] → se usa el mismo string literal de la CSP que en `nginx.conf` y el test de paridad compara el valor completo, de modo que cualquier error de escapado se detecta en test y no en producción.
- [El build de Astro del sitio público depende de la API para generar el catálogo] → los tests de Vitest no dependen del build; la verificación del `dist/` se ejecuta con el script standalone y en el pipeline existente, no en la suite unitaria.
- [La redirección 301 entra en producción antes de que exista el certificado TLS] → el path de desafío ACME queda excluido de la redirección para no bloquear la emisión/renovación; si el certificado no está emitido, las peticiones HTTP terminan en un error de TLS del servidor, y por eso la activación del certificado en cPanel se verifica en la tarea 8.10 antes de dar el despliegue por bueno.
- [Sobrecribir el `.htaccess` borra la configuración de PHP de cPanel que había en el hosting] → verificado en staging: el `.htaccess` original sólo declaraba el handler `ea-php81` y la ruta del log de errores de cPanel. Es irrelevante para los frontends estáticos (Astro SSG y Angular SPA); el operador conservó una copia local del original y, si el cliente habilitara PHP, la configuración tendría que declararse en los `.htaccess` del repositorio.
- [LiteSpeed podría normalizar `%{HTTPS}` de forma distinta a Apache] → verificado empíricamente en staging: la condición `!=on` produce el `301` esperado y no hay bucle de redirección (la URL por HTTPS responde `200`).

## Migration Plan

1. Implementar los `.htaccess` y su publicación en el build con sus tests (TDD: test fallido primero).
2. Ejecutar `npm run build --workspace=@riff/web` y `--workspace=@riff/admin` y comprobar que `.htaccess` (raíz y, en web, `_astro/`) y `404.html` quedan donde corresponde.
3. Ejecutar `npm run verify:htaccess --workspace=@riff/web` y `--workspace=@riff/admin` contra esos builds.
4. Verificar que `make docker-build` sigue funcionando (los Dockerfiles y `nginx.conf` no cambian; los `.htaccess` extra en el `dist/` son inocuos para nginx).
5. Verificación empírica en el hosting: subir `.htaccess` + un asset real + `404.html`, ejecutar `curl -I` y revisar el error log según el checklist. **Hecho en staging** (ver la sección "Verificación empírica en el hosting"): cabeceras, CSP, caché, `404.html`, fallback SPA y redirección 301 verificados sin incidencias.
6. Cuando la subida por FTP se implemente en un ciclo posterior, los `.htaccess` viajan dentro del `dist/` y aterrizan en la raíz del subdominio sin pasos adicionales.

**Rollback:** revertir el commit de este change elimina los `.htaccess`, el `404.astro` y la entrada de assets de `angular.json`; el hosting vuelve al comportamiento por defecto (sin cabeceras de seguridad). No hay migraciones de datos ni cambios de estado en el servidor.

## Verificación empírica en el hosting (resultados)

Ejecutada por el operador sobre el hosting LiteSpeed de staging, con `curl -I` sobre los subdominios `staging.somosriff.cl` (sitio público) y `admin-staging.somosriff.cl` (panel), tras subir los `.htaccess` del repositorio junto con un asset real y el `404.html`.

**Sitio público (`staging.somosriff.cl`)**

| Comprobación | Resultado observado |
| --- | --- |
| Home por HTTPS | `200` con las cuatro cabeceras de seguridad, CSP completa (`font-src 'self' https: data:`) y `cache-control: no-cache` |
| Asset con hash de `/_astro/` (`aerosan.BDFHrsO0.png`) | `cache-control: public, max-age=31536000, immutable` y las cabeceras de seguridad; LiteSpeed añade además `expires` a un año |
| Ruta inexistente | `404` con las cabeceras de seguridad y cuerpo idéntico a `404.html` |
| Petición por HTTP | `301` a `https://staging.somosriff.cl/`; la URL por HTTPS responde `200` (sin bucle de redirección) |

**Panel (`admin-staging.somosriff.cl`)**

| Comprobación | Resultado observado |
| --- | --- |
| Bundle `chunk-0w9Gt-om.js` y fuente `media/*.woff2` | `public, max-age=31536000, immutable` y las cabeceras de seguridad; el hosting fija `content-type: application/x-javascript` para los bundles |
| Ruta profunda inexistente por HTTPS | `200` con `index.html` y `no-cache` (fallback SPA operativo) |
| Ruta profunda por HTTP | `301` a la misma ruta por HTTPS (la redirección se evalúa antes del fallback SPA); la URL por HTTPS responde `200` |

**Hallazgo sobre el `.htaccess` previo del hosting**: el `.htaccess` original de ambas carpetas contenía únicamente configuración de PHP generada por cPanel (handler `ea-php81` y ruta del log de errores), sin ninguna redirección. Se sobrescribió con el fichero del repositorio y el operador conservó una copia local del original. Confirma la premisa de D7: una redirección configurada desde el panel se habría perdido en el siguiente despliegue, por lo que la regla 301 debe vivir en el repositorio.

**Conclusión**: el contrato LiteSpeed del repositorio (cabeceras de seguridad, CSP, caché inmutable de assets con hash, `no-cache` del HTML, `404.html` y fallback SPA) queda verificado en el hosting real, y la redirección canónica 301 HTTP→HTTPS funciona sin bucles.

## Open Questions

- ¿El hosting cPanel tiene `AllowOverride` con `FileInfo`, `Options`, `Limit` y `AuthConfig` para el directorio del subdominio, y `mod_headers`/`mod_rewrite` disponibles? Verificado empíricamente: el `.htaccess` se aplica (cabeceras, caché, redirección y fallback SPA observados), por lo que los módulos y la sobrescritura están permitidos.
- ¿El subdominio del panel tiene su propia cuenta FTP y su propia raíz, o comparte raíz con el sitio público? Confirmado en la práctica: cada subdominio tiene su propia raíz y su propio `.htaccess`.
- ¿El cliente tiene el certificado TLS emitido y activo en cPanel? Verificado en staging: la redirección 301 lleva a una URL HTTPS que responde `200`, sin bucle. Queda por confirmar que el mismo certificado esté activo en producción.
- ¿Se mantiene la verificación del `dist/` encadenada en el gate `ci`? Decidido: sí, mediante el target `verify-htaccess` (D2), sin tocar ningún otro target del `Makefile`.
- ¿Hay que reincorporar la configuración de PHP de cPanel (`ea-php81`) al `.htaccess` del repositorio para los despliegues futuros? Hoy es innecesaria (frontends estáticos) y se documenta como decisión consciente; si el cliente habilita PHP en el hosting, la configuración pasaría a declararse también en el repositorio.
