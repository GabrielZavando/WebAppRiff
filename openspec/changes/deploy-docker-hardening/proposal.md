# Proposal: Hardening de deploys Docker — admin env build args, sharp en web, favicon y gate de CI

## Why

Tras mergear `admin-panel-foundation` y `nosotros-page`, los dos deploys de
Coolify (`riff-admin-staging` y `riff-web-staging`) fallan al construir sus
imágenes Docker: el build de admin espera un archivo gitignored que no existe
en un checkout limpio (reproducido y confirmado con `docker build`), y el build
de web no encuentra sharp en el builder de Coolify (`MissingSharp` confirmado
con el log completo; el build local con el mismo comando del Dockerfile pasa,
por lo que el fallo es específico del entorno del builder).
El CI actual no detecta nada de esto porque `make ci` valida el build del host,
nunca el build en contenedor: necesitamos corregir ambos bugs y añadir un gate
que construya las dos imágenes en cada PR.

## What Changes

- **Bug 1 — admin (`apps/admin`)**: el build Docker falla con
  `The /app/apps/admin/src/environments/environment.production.ts path in file
  replacements does not exist.` El `Dockerfile` usa `--ignore-scripts` (el
  `postinstall` que genera el archivo nunca corre) y no ejecuta
  `write-env.mjs --target=prod`. Fix: build args (`FIREBASE_API_KEY`,
  `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`,
  `API_BASE_URL`) + generación del environment en el Dockerfile antes del
  build. Documentación de los build args en `docs/deploy-standards.md` (mismo
  tratamiento que `PUBLIC_API_URL` de web).
- **Hardening de `.dockerignore`**: excluir
  `apps/admin/src/environments/environment.production.ts` del contexto — hoy un
  build local copia el archivo gitignored (con credenciales reales) dentro de
  la imagen, y además hace que el build local pase mientras Coolify falla.
- **Bug 2 — web (`apps/web`)**: sharp no queda disponible en el contenedor del
  builder de Coolify durante `astro build` (`MissingSharp` confirmado con el
  log completo). sharp ya es dependencia directa de `apps/web` (desde
  `934e572`) y `0.35.5` satisface el rango de astro 7.1.6; el build local con
  el mismo comando del Dockerfile instala sharp y funciona (55 imágenes
  optimizadas, exit 0). Causa más probable: los bindings de plataforma
  (`@img/sharp-*`) declarados como `optionalDependencies` no se resuelven bajo
  `--workspace` + `--ignore-scripts` en ese entorno. Fix definitivo: fijar
  `@img/sharp-linux-x64` + `@img/sharp-libvips-linux-x64` como
  `optionalDependencies` explícitas de `@riff/web` (regenerando lockfile) +
  fail-fast de sharp en el Dockerfile.
- **Favicon del admin**: `apps/admin` no tiene favicon (404 en consola). Usar el
  mismo archivo que web (`apps/web/public/logo_riff.png`, mismo origen
  `/logo_riff.png`).
- **Gate de CI — build Docker**: target `docker-build` en el `Makefile` (ambas
  imágenes, args de prueba, sin push) + job nuevo en
  `.github/workflows/ci.yml` que lo invoque. Un PR que rompa cualquiera de los
  dos Dockerfiles falla el CI.
- **Deuda conocida documentada** (heredada de `admin-panel-foundation`; no se
  arregla en este change): ver sección "Deuda conocida" más abajo.

## Capabilities

### New Capabilities

Ninguna. Este change no introduce capacidades de producto: corrige builds de
deploy, tooling de CI y un asset estático del panel.

### Modified Capabilities

Ninguna. Sin cambios en requisitos observables de producto: los bundles
generados mantienen los mismos contratos (el environment de producción pasa de
"no existe" a "generado desde build args", con los mismos campos del modelo
`AdminEnvironment`), y el favicon añade un asset que hoy 404.

## Impact

- **`apps/admin/Dockerfile`**: build args, `COPY apps/admin/scripts/`,
  ejecución de `write-env.mjs --target=prod` antes de `ng build`.
- **`.dockerignore`**: exclusión de `environment.production.ts`.
- **`apps/web/Dockerfile`**: fail-fast de sharp tras `npm ci` + corrección del
  comentario sobre optional deps.
- **`apps/web/package.json` + `package-lock.json`**: `optionalDependencies`
  explícitas con los bindings de plataforma de sharp para linux/x64
  (`@img/sharp-linux-x64`, `@img/sharp-libvips-linux-x64`).
- **`apps/admin/angular.json` + `apps/admin/src/index.html`**: asset de favicon
  y su `<link rel="icon">`.
- **`Makefile` + `.github/workflows/ci.yml`**: target `docker-build` y job de CI
  (~5-10 min adicionales en una lane paralela; el tiempo del job `ci` actual no
  cambia).
- **`docs/deploy-standards.md`**: build args del admin + variables de build de
  Coolify para `riff-admin-staging`/`riff-admin-prod`.
- **Sin cambios**: specs de producto, API, base de datos, dependencias de
  runtime de los bundles.

## Deuda conocida (documentada, fuera de alcance)

Arrastrada del change `admin-panel-foundation`; se registra aquí para que no se
pierda:

1. **`GET /quotes` es `admin+`** aunque un `editor` puede hacer `PATCH` del
   estado de una cotización → un editor no puede listar las cotizaciones que
   debe gestionar. Fix previsto en el change `admin-panel-operations`.
2. **Persistencia del estado del sidebar** tras recargar el panel: no requerido
   por spec; mejora de UX opcional.
3. **`GET /contacts` no existe** en la API: no se puede listar contactos desde
   el panel (solo se crean vía formularios públicos).
