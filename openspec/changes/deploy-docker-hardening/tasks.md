# Tasks — deploy-docker-hardening

> Referencias: `design.md` (decisiones D1-D6, evidencia de diagnóstico) y
> `proposal.md` (motivación, alcance, deuda conocida).

## 1. Reproducción y evidencia (antes de tocar código)

- [x] 1.1 Reproducir Bug 1 desde checkout limpio (simula Coolify): `git clone` del repo a `/tmp` + `docker build -f apps/admin/Dockerfile .` — documentar error `file replacements does not exist` con log _(hecho en planificación 2026-10-12; evidencia en design.md, Contexto)_
- [x] 1.2 Capturar el log completo del build fallido de Coolify de `web-staging` (mensaje completo del error de sharp: `MissingSharp` vs `libvips`/`prebuilt binary`; buscar en `npm ci` advertencias de optional deps omitidas) — cierra Q1 de design.md _(hecho: `MissingSharp: Could not find Sharp...`; cita en design.md, Contexto)_
- [x] 1.3 Determinar la arquitectura del host de Coolify (`uname -m` o logs del build) — cierra Q2 de design.md _(hecho: `x86_64`)_
- [x] 1.4 Baseline local de web: `docker build --build-arg REQUIRE_API=false -f apps/web/Dockerfile .` en verde (linux/amd64) — documentar que el fallo es host-específico y registrar el baseline en este change _(hecho: exit 0, 55 imágenes optimizadas; design.md, Contexto)_

## 2. Bug 1 — admin: environment de producción vía build args (D1, D2)

- [x] 2.1 Añadir `apps/admin/src/environments/environment.production.ts` a `.dockerignore` (D2) y verificar con `docker build` local que el contexto ya no incluye el archivo _(probe `COPY` sobre scratch: `not found` = excluido)_
- [x] 2.2 Actualizar `apps/admin/Dockerfile`: `ARG` + `ENV` de las 5 variables (`FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `API_BASE_URL`), `COPY apps/admin/scripts ./apps/admin/scripts`, y `RUN node scripts/write-env.mjs --target=prod` antes del build (D1) _(ruta real: `node apps/admin/scripts/write-env.mjs`; el log confirma `[write-env] wrote ...`)_
- [x] 2.3 Verificar con build Docker real: `docker build` con build args de prueba (fake, sin secretos) — extraer el bundle (`docker create` + `docker cp`) y grep: `dev-placeholder-api-key` NO aparece; el valor inyectado SÍ aparece _(grep limpio; `ci-test-firebase-api-key` en `main-*.js`)_
- [x] 2.4 Añadir smoke de regresión del bundle (D6): script que corre `ng build --configuration production` y verifica que el bundle no contiene placeholders de `environment.ts` y sí el valor inyectado de prueba; registrar cómo ejecutarlo _(`npm run test:build --workspace=@riff/admin` — `apps/admin/scripts/check-bundle-env.mjs`; verde 2/2 markers; cómo ejecutarlo documentado en docs/deploy-standards.md)_

## 3. Bug 2 — web: causa raíz confirmada, fix definitivo (D3)

- [x] 3.1 Declarar en `apps/web/package.json` las `optionalDependencies` explícitas `@img/sharp-linux-x64@0.35.5` y `@img/sharp-libvips-linux-x64@1.3.4` (el filtrado `os:["linux"]`/`cpu:["x64"]` viene de los manifiestos de los propios paquetes) y regenerar `package-lock.json`; verificar que en macOS local npm las salta sin error (D3) _(diff del lockfile: 5 líneas; manifiestos verificados; skip sin error evidenciado en el caso simétrico darwin/linux — no hay macOS en esta máquina, anotado en verification.md)_
- [x] 3.2 Añadir fail-fast de sharp en `apps/web/Dockerfile` tras el `npm ci` del stage de build: `RUN node -e "const sharp = require('sharp'); console.log('sharp OK:', sharp.versions.sharp, '| vips:', sharp.versions.vips)"`; corregir el comentario del stage html-sanitize sobre optional deps ("skipping scripts is safe", incorrecto para este setup) (D3) _(log: `sharp OK: 0.35.5 | vips: 8.18.7` tras el `npm ci`)_
- [x] 3.3 Verificar: `docker build -f apps/web/Dockerfile .` (con args de staging) completa (exit 0), SIN ningún `MissingSharp`/WARN de imagen en la salida y con las imágenes optimizadas generadas; servir la imagen (`docker run -p 8080:80`) y validar `/nosotros` con sus imágenes optimizadas (no rotas, no 404); registrar la validación (comandos + salida) _(exit 0; 0 MissingSharp; 55/55 imágenes; `/nosotros/` → 200 con 7 refs webp; muestras servidas 200 `image/webp`. Detalle en verification.md)_
- [x] 3.4 Contingencia: si `MissingSharp` reaparece en un deploy de Coolify tras el fix, re-lanzar el build con `--no-cache` para descartar capa corrupta/base vieja del daemon y registrar el resultado (D3) _(protocolo documentado en design.md D3; no ha reaparecido — aplica solo si el deploy vuelve a fallar)_

## 4. Favicon del admin (D4)

- [x] 4.1 Ampliar `assets` en `apps/admin/angular.json` con el mapeo `{ "glob": "logo_riff.png", "input": "apps/web/public", "output": "/" }` (si el builder lo rechaza, aplicar el fallback documentado en D4 y registrar la deuda de duplicación) _(builder confirma: `input` debe vivir dentro del workspace root de admin — ver D4 actualizado; mecanismo final: `scripts/sync-favicon.mjs` en hook `prebuild` copia el binario de web a `src/favicon/` (gitignored), sin duplicación)_
- [x] 4.2 Añadir `<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32" />` en `apps/admin/src/index.html`
- [x] 4.3 Verificar: el build de admin emite `logo_riff.png` en la raíz del bundle y la imagen servida responde 200 (incluir en la verificación del gate `make docker-build` o del build local de 2.3) _(sha256 idéntico al de web; `GET /logo_riff.png` → 200 en la imagen servida)_

## 5. Gate de CI — build Docker (D5)

- [x] 5.1 Añadir target `docker-build` al `Makefile`: construye `apps/admin/Dockerfile` (build args de prueba fake) y `apps/web/Dockerfile` (`REQUIRE_API=false`, args de prueba), sin push; falla si alguno falla; actualizar `help`
- [x] 5.2 Añadir job `docker-build` en `.github/workflows/ci.yml` que ejecute `make docker-build` en `ubuntu-latest`, en paralelo con el job `ci` (sin `needs`, D5)
- [x] 5.3 TDD del gate: ejecutar `make docker-build` ANTES de aplicar los fixes de 2.2/3.1 y confirmar que falla (reproduce Bug 1 desde checkout limpio); después de los fixes, confirmar en verde _(rojo: `file replacements does not exist` (exit 2); verde: exit 0, `[write-env] wrote ...` + bundle generado)_
- [x] 5.4 Medir y registrar la duración del job `docker-build` (criterio: <10 min añadidos al pipeline; lane paralela no incrementa el job `ci`) _(caché fría local (tras `docker builder prune`): 93s ambas imágenes, exit 0; en runner de GH se espera 2-4x — verificación.md; lane paralela: tiempo de pared = max(ci, docker-build))_

## 6. Documentación

- [x] 6.1 Documentar en `docs/deploy-standards.md` los build args del admin (tabla + Build Variables de Coolify para `riff-admin-staging`/`riff-admin-prod`), mismo tratamiento que `PUBLIC_API_URL` de web (D1) _(tabla `Environment Variables` actualizada (5 args, `API_URL`→`API_BASE_URL`) + sección "Build variables de las apps frontends")_
- [x] 6.2 Documentar en `docs/deploy-standards.md` (o sección del change) el gate `make docker-build` y su alcance honesto (no detecta fallos host-específicos de Coolify, D5) _(en la misma sección; incluye el fail-fast de sharp y los smokes post-deploy como red para la clase host-específica)_
- [x] 6.3 Confirmar que la deuda conocida de `admin-panel-foundation` (GET /quotes admin+, sidebar, GET /contacts) está registrada en `proposal.md` y no se perdió _(sección "Deuda conocida" en proposal.md, 3 ítems)_

## 7. Verificación final

- [x] 7.1 `make ci` completo en verde _(exit 0, 133s; audit PASS)_
- [x] 7.2 `make docker-build` en verde (target nuevo) _(caché fría: exit 0, 93s)_
- [x] 7.3 `npx openspec validate --all --strict` sin errores _(77 passed, 0 failed)_
- [x] 7.4 Builds Docker locales de admin y web completados con éxito, documentando comandos exactos y salida en el reporte del change _(openspec/changes/deploy-docker-hardening/verification.md)_
- [ ] 7.5 Tras el merge: configurar Build Variables en Coolify (`riff-admin-staging`) y confirmar que ambos deploys de Coolify (`web-staging`, `admin-staging`) pasan + smokes de staging en verde _(requiere merge + panel de Coolify — acción humana post-merge, checklist en verification.md §6)_
