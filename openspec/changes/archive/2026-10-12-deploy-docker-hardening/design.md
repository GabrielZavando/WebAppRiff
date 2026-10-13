# Design: Hardening de deploys Docker

## Contexto

Dos bugs de build Docker bloquean los deploys de Coolify tras mergear
`admin-panel-foundation` y `nosotros-page`. Ambos se reprodujeron localmente el
2026-10-12 (planificación de este change) y la evidencia está documentada aquí.

**Bug 1 — admin: reproducido y causa raíz confirmada.**

- Comando de repro (simula Coolify: checkout limpio, el archivo gitignored no
  existe):
  ```bash
  git clone /home/gabriel/Clientes/Riff/WebApp /tmp/opencode/riff-clean
  docker build -f apps/admin/Dockerfile -t riff-admin-repro /tmp/opencode/riff-clean
  ```
- Error observado (exit 1):
  `An unhandled exception occurred: The /app/apps/admin/src/environments/environment.production.ts path in file replacements does not exist.`
- Cadena causal verificada en el código:
  1. `apps/admin/angular.json` (configuración `production`) reemplaza
     `src/environments/environment.ts` → `src/environments/environment.production.ts`.
  2. `environment.production.ts` está gitignored (`.gitignore:43`); se genera
     con `scripts/write-env.mjs --target=prod` desde variables de entorno.
  3. El `postinstall` de `@riff/admin` ejecuta `write-env.mjs` para ambos
     targets, pero el Dockerfile instala con `--ignore-scripts`
     (`apps/admin/Dockerfile:24`), así que nunca corre.
  4. Además el Dockerfile ni siquiera copia `apps/admin/scripts/` (solo copia
     `package.json`, `angular.json`, `tsconfig*.json` y `src/`), por lo que
     `write-env.mjs` no estaría disponible en el contenedor aunque se invocara.
- **Hallazgo de seguridad adicional**: `.dockerignore` no excluye
  `environment.production.ts`, así que un `docker build` local (donde el
  archivo existe con credenciales reales) lo copia dentro del contexto y lo
  hornea en la imagen. Esto además explica por qué el bug "no se veía" en
  local: el build local pasaba porque el archivo gitignored viajaba al
  contexto. El build de Coolify (clone limpio) es el único fiel al repo.

**Bug 2 — web: causa raíz confirmada con el log completo de Coolify (2026-10-12).**

- Evidencia del log de Coolify (`riff-web-staging`):
  ```
  [WARN] [build] Unable to generate optimized image for /_astro/logo-web...:
    MissingSharp: Could not find Sharp. Please install Sharp (`sharp`) manually
    into your project or migrate to another image service.

  Caused by:
    Could not find Sharp. Please install Sharp (`sharp`) manually into your
    project or migrate to another image service.
  ```
  sharp **no queda disponible** en el contenedor del builder durante
  `astro build`.
- `loadSharp` en Astro (`node_modules/astro/dist/assets/services/sharp.js:59`)
  hace `await import("sharp")` en un `try/catch` y lanza
  `AstroError(MissingSharp)` — *"Could not find Sharp. Please install Sharp
  (`sharp`) manually into your project"* — ante cualquier fallo del import.
- Datos que acotan la causa:
  - **sharp YA es dependencia directa** de `apps/web/package.json`
    (`dependencies`, `"sharp": "^0.35.3"`, commit `934e572`); el lockfile
    resuelve `0.35.5` (`dev:false, optional:false`).
  - **Versión compatible con astro 7**: `astro@7.1.6` declara
    `optionalDependencies: { "sharp": "^0.34.0 || ^0.35.0" }` → `0.35.5`
    satisface el rango.
  - **Build local con el MISMO comando del Dockerfile funciona** (linux/amd64,
    Docker 28.1.1): `docker build --build-arg REQUIRE_API=false -f
    apps/web/Dockerfile .` → exit 0, 55 imágenes optimizadas, cero
    `MissingSharp`. (Con `REQUIRE_API=true` el build local falla antes, en el
    fetch de la API — `api.somosriff.cl` sin DNS público y la URL de staging
    `*.run.app` vive solo en secretos —, por eso la ruta completa de datos no
    es replicable localmente; en Coolify la API sí es alcanzable y el build
    llegó a la fase de imágenes.)
  - **Arquitectura del host de Coolify confirmada: `x86_64`** (`uname -m` en
    el VPS) — descarta hipótesis arm64/musl.
- **Causa más probable** (mecanismo): los bindings de plataforma de sharp
  (`@img/sharp-linux-x64`, `@img/sharp-libvips-linux-x64`) están declarados
  como `optionalDependencies` **de sharp** en el lockfile; bajo
  `npm ci --workspace=@riff/web --include-workspace-root=false
  --ignore-scripts` en el entorno del builder de Coolify (npm/estado de caché
  propios del daemon) no se resuelven, sharp queda sin su binding nativo y
  `import("sharp")` lanza `MissingSharp`. El comentario del Dockerfile que
  asumía *"sharp/esbuild ship prebuilt binaries as optional dependencies, so
  skipping scripts is safe"* es incorrecto para este setup y se corrige en el
  fix (D3). En local el mismo comando sí resuelve las optionals: el fallo es
  específico del entorno del builder, no del lockfile.

**Contexto de CI y deploy.**

- `make ci` = `openspec-validate lint typecheck build test-ci audit` sobre el
  host: nunca construye contenedores. El workflow `.github/workflows/ci.yml`
  tiene un único job `ci` sobre `ubuntu-latest` (x64).
- Coolify construye in-situ (`build in-situ` en `docs/deploy-standards.md`) con
  build args configurados por app; los del admin no están documentados aún.
- Favicon: `apps/web/src/layouts/Layout.astro:86` usa
  `<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32" />`
  con el archivo en `apps/web/public/logo_riff.png`. `apps/admin` no tiene ni
  el `<link>` (`src/index.html`) ni el asset (`assets: ["src/assets"]`).

## Goals / Non-Goals

**Goals:**

- G1: el build Docker de admin completa desde un checkout limpio, con las 5
  variables inyectadas vía build args y el bundle de producción usando los
  valores inyectados (nunca placeholders).
- G2: eliminar el vector de fuga de credenciales del contexto Docker.
- G3: el build Docker de web vuelve a completar en Coolify, con sharp (paquete
  ya directo + bindings de plataforma fijados explícitamente) cargando de forma
  verificable (fail-fast en el Dockerfile) y `/nosotros` sirviendo sus imágenes
  optimizadas.
- G4: gate de CI que construye ambas imágenes en cada PR, detectando roturas de
  Dockerfile antes del merge (<10 min añadidos al pipeline).
- G5: favicon del admin servido desde el mismo archivo/origen que web.
- G6: documentar build args del admin y la deuda conocida.

**Non-Goals:**

- Arreglar la deuda de `admin-panel-foundation` (ver proposal): `GET /quotes`
  admin+, persistencia del sidebar, `GET /contacts`.
- Publicar imágenes a un registry desde CI (push sigue siendo Coolify in-situ).
- Cambiar el modelo de environment del admin (`AdminEnvironment` intacto) ni
  commitear `environment.production.ts` al repo.
- Reemplazar el image service de Astro ni introducir optimización de imágenes
  remotas nuevas.
- Ejecutar smoke E2E Playwright dentro del build de Docker (la validación de
  imágenes de `/nosotros` se hace serviendo la imagen localmente).

## Decisiones

### D1 — Bug 1: generar el environment de producción dentro del Dockerfile vía build args

El stage de build de `apps/admin/Dockerfile` hará:

1. `ARG` para las 5 variables: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`,
   `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`, `API_BASE_URL` (default de
   `API_BASE_URL`: `http://localhost:3000/api/v1`, igual que `write-env.mjs`).
2. `ENV` con esas variables en el stage de build (necesario porque `ARG` no es
   visible a procesos del `RUN` salvo que se promueva a `ENV`).
3. `COPY apps/admin/scripts ./apps/admin/scripts` (hoy no se copia).
4. `RUN node scripts/write-env.mjs --target=prod` **antes** de
   `npm run build --workspace=@riff/admin` (sin `--if-missing`: en el contenedor
   el archivo nunca debe preexistir, ver D2).

**Alternativas descartadas:**

- *Commitear `environment.production.ts`*: viola el diseño D3 de
  `admin-panel-foundation` (secretos de Firebase nunca en git), rota mal y
  filtra credenciales en el historial.
- *Ejecutar el `postinstall` sin `--ignore-scripts`*: el `postinstall` del root
  y los `prepare` de workspaces dependen de devDeps que una instalación
  filtrada no provee (comentario del propio Dockerfile de web); abrir esa puerta
  re-abre el problema que `--ignore-scripts` resuelve. Además `--if-missing`
  no regeneraría el archivo si el contexto lo trae stale (D2).
- *Inyectar los valores por `sed` sobre `environment.ts`*: duplicaría la lógica
  de generación que `write-env.mjs` ya centraliza y testea.

Coolify pasará los valores reales como Build Variables (build args) de las apps
`riff-admin-staging`/`riff-admin-prod`; la documentación va a
`docs/deploy-standards.md` con el mismo formato que la tabla de web
(`SITE_URL`/`NESTJS_API_URL`/`REQUIRE_API`/`PUBLIC_API_URL`). Los 5 valores son
públicos por diseño (Firebase web API key y dominio de auth son datos públicos
del cliente web; `API_BASE_URL` apunta a la API pública) — igual criterio que
el bundle actual de web, y el archivo generado es el mismo que hoy produce el
`postinstall` en las máquinas de dev.

### D2 — `.dockerignore`: excluir `environment.production.ts`

Añadir `apps/admin/src/environments/environment.production.ts` al
`.dockerignore` raíz. Efectos: (1) cierra la fuga de credenciales reales hacia
el daemon en builds locales; (2) hace que el build local sea idéntico al de
Coolify (checkout limpio), eliminando la clase de bug "pasa en local, falla en
deploy"; (3) obliga a que el valor siempre venga de build args. El
`environment.development.local.ts` ya queda cubierto por el patrón `*.local`
existente.

### D3 — Bug 2: causa raíz confirmada y fix definitivo

**Fix en dos capas (ambas obligatorias):**

1. **Fijar los bindings de plataforma como `optionalDependencies` explícitas de
   `@riff/web`** en `apps/web/package.json` (versiones exactas del lockfile):
   - `@img/sharp-linux-x64@0.35.5`
   - `@img/sharp-libvips-linux-x64@1.3.4`
   Regenerar `package-lock.json`. El filtrado de plataforma no se declara en
   nuestro `package.json`: viene de los manifiestos `os`/`cpu` de los propios
   paquetes `@img/*` (`os: ["linux"]`, `cpu: ["x64"]`), así que en macOS (dev)
   npm los salta sin error (son optionals) y en el builder linux/x64 se
   instalan como dependencias de primera clase del workspace filtrado, no como
   optionals transitivas de sharp que npm puede omitir silenciosamente en ese
   entorno.
2. **Fail-fast de sharp en el Dockerfile** — inmediatamente después del
   `npm ci` del stage de build:
   ```dockerfile
   RUN node -e "const sharp = require('sharp'); console.log('sharp OK:', sharp.versions.sharp, '| vips:', sharp.versions.vips)"
   ```
   Si sharp o su binding faltan, el build falla a los ~2 s con mensaje
   explícito, en vez de un `MissingSharp` (WARN por imagen) durante el
   prerender. Además se corrige el comentario del stage html-sanitize que
   afirmaba que saltarse los scripts es seguro por los binarios prebuilt
   (incorrecto para este setup, ver Contexto).

**Contingencia documentada**: si `MissingSharp` reaparece en un deploy de
Coolify tras el fix, re-lanzar el build con `--no-cache` para descartar una
capa corrupta/base vieja del daemon antes de seguir investigando.

**Alternativas descartadas con esta evidencia:**

- *Opción A (declarar sharp como dependencia directa)*: ya está hecha desde
  `934e572` (`sharp@^0.35.3` en `dependencies` de `apps/web`) y no impidió el
  fallo — insuficiente por sí sola.
- *Opción B (instalar sharp a mano en el Dockerfile con `npm install`)*:
  rompe la reproducibilidad del lockfile y añade variabilidad de versión.
- *Opción C (cambiar imagen base a `node:24-slim`/`node:24-alpine`)*:
  descartada por evidencia — el host es `x86_64`, el mensaje es literalmente
  `Could not find Sharp` (no un error de libc/binding/libvips) y la misma base
  `node:24` funciona en el build local.
- *Passthrough image service de Astro (no usar sharp)*: degradaría la calidad
  de las imágenes del sitio (sin webp/avif); inaceptable para el catálogo.

### D4 — Favicon del admin: un solo archivo, origen idéntico a web

**Restricción descubierta en implementación** (verificada en
`@angular-devkit/build-angular/src/utils/normalize-asset-patterns.js:98-100`):
el `input` de un asset objeto-form se resuelve contra el **workspace root de la
app** (el dir que contiene `angular.json` = `apps/admin`) y debe quedar dentro
de él — un input como `apps/web/public` se resuelve a
`apps/admin/apps/web/public` (no existe → glob vacío, asset omitido
silenciosamente) y un `../../web/public` lanzaría
`The ... asset path must be within the workspace root.` El mapeo cross-app
directo es imposible.

**Mecanismo elegido** (conserva los principios de D4: binario único, misma URL,
sin drift):

1. `apps/admin/scripts/sync-favicon.mjs` (hook npm `prebuild`, host y Docker)
   copia `../web/public/logo_riff.png` → `src/favicon/logo_riff.png`
   (gitignored y excluido en `.dockerignore`: archivo generado, mismo patrón
   que `write-env.mjs`).
2. `angular.json` lo emite en la raíz del bundle:
   `{ "glob": "logo_riff.png", "input": "src/favicon", "output": "/" }`.
3. `apps/admin/src/index.html` usa el mismo `<link>` que web:
   `<link rel="icon" type="image/png" href="/logo_riff.png" sizes="32x32" />`.
4. En Docker, el stage de build de admin copia primero la fuente:
   `COPY apps/web/public/logo_riff.png ./apps/web/public/logo_riff.png`.

Así admin sirve exactamente `/logo_riff.png` (mismo binario — verificado por
sha256 — y misma URL) desde la única copia del archivo en el repo
(`apps/web/public/`). No hace falta el fallback de duplicación.

**Alternativas descartadas:**

- *Duplicar el PNG en `apps/admin/src/`* (fallback original de D4): dos copias
  que divergen con el tiempo; la copia generada en build time lo evita sin
  añadir fricción.
- *Symlink `apps/admin/src/favicon` → `../web/public`*: frágil (soporte de
  symlinks en git/checkouts y COPY de Docker) para ahorrar un script trivial.
- *Servir `/assets/logo_riff.png` reutilizando el asset `src/assets`*: rompería
  la URL idéntica a web (`/logo_riff.png`), parte del requisito.

### D5 — Gate de CI: target `make docker-build` + job paralelo

- **Makefile**: target `docker-build` que construye ambas imágenes y falla si
  alguna falla:
  - admin: con build args de prueba (`FIREBASE_API_KEY=test-...` etc., valores
    fake, nunca secretos reales).
  - web: `--build-arg REQUIRE_API=false` + `SITE_URL`/`NESTJS_API_URL`/
    `PUBLIC_API_URL` de prueba. Sin push.
- **Workflow**: job nuevo `docker-build` en `.github/workflows/ci.yml` que
  ejecuta `make docker-build` en `ubuntu-latest`, **en paralelo** con el job
  `ci` existente (sin `needs`).

**Por qué separado de `make ci`**: los builds Docker son lentos (instalan
dependencias dentro del contenedor: ~5-10 min sumados); meterlos dentro de
`make ci` retrasaría el feedback rápido de lint/typecheck/test para todos los
cambios, incluso los que no tocan Dockerfiles. Como lane paralela, el tiempo de
pared del pipeline pasa a ser `max(ci, docker-build)` en vez de `ci +
docker-build`, cumpliendo el criterio de <10 min añadidos.

**Por qué en paralelo y no después de `ci`**: no comparten dependencias (el
build Docker es autocontenido: `npm ci` dentro del contenedor); un `needs: ci`
ahorraría cómputo en PRs ya rotos pero sumaría la duración completa del job
Docker al tiempo de pared, violando el presupuesto. Ambos jobs son requeridos
para el merge (branch protection).

**Alcance honesto del gate**: detecta roturas de Dockerfile/determinismo de
checkout limpio — habría atrapado el Bug 1 (el checkout de CI es limpio, como
Coolify). **No** puede detectar fallos específicos del host de Coolify (Bug 2):
`ubuntu-latest` es x64 con red de GH; el fallo de sharp de Coolify es
host-específico. Para esa clase queda el fail-fast de D3 (mensaje claro y
temprano en los logs de Coolify) + el smoke post-deploy de staging.

**`REQUIRE_API=false` en el gate**: hace el build determinista y sin
dependencia externa (una API caída no debe romper el CI de un PR de CSS). El
precio: el gate no ejercita la ruta de datos con API real; eso lo cubren el
deploy de Coolify (que usa `REQUIRE_API=true`) y los smokes post-deploy
existentes (`scripts/smoke/web.mjs`).

### D6 — Detección de regresión del Bug 1 (más allá del gate)

Además del job `docker-build` (que ya es el detector principal: un checkout
limpio + build args falla si el environment no se genera), un smoke de bundle:
script (`apps/admin/scripts` o `scripts/smoke/`) que hace
`ng build --configuration production` local y verifica que el bundle **no**
contenga el marcador `dev-placeholder-api-key` (los placeholders commiteados de
`environment.ts`) y sí contenga el valor inyectado de prueba. Se documenta en
`docs/deploy-standards.md` junto a los build args.

## Riesgos / Trade-offs

- **[R1] El mecanismo exacto de omisión en el builder de Coolify es el más
  probable, no atribuible al 100% a una versión concreta de npm** (el log
  confirma el síntoma `MissingSharp`, no la línea de npm que lo causó) → el
  fix de D3 actúa sobre el mecanismo (bindings como dependencias de primera
  clase del workspace filtrado) y el fail-fast convierte cualquier reaparición
  en un fallo inmediato y legible; si reaparece, re-build con `--no-cache`
  descarta capa corrupta del daemon.
- **[R2] El gate Docker añade tiempo de cómputo a cada PR** (docker pull +
  2 builds) → lane paralela (D5); presupuesto <10 min; sin push (solo build).
- **[R3] Rate limits de Docker Hub en CI** (pull de `node:24`/`nginx:alpine` en
  cada run) → aceptable en MVP (pulls pequeños, runners de GH con IP variada);
  si aparece, migrar el gate a cache de buildx en un follow-up.
- **[R4] `REQUIRE_API=false` en el gate no ejercita la ruta de datos real** →
  documentado en D5; Coolify sí construye con `REQUIRE_API=true` y los smokes
  post-deploy validan el sitio desplegado.
- **[R5] Build args del admin en Coolify mal configurados** (variable ausente
  → `write-env.mjs` escribe vacío con warning) → `docs/deploy-standards.md`
  lista las 5 variables exactas para las apps de Coolify; el smoke del bundle
  (D6) detecta un bundle sin valores inyectados.
- **[R6] El build de admin depende de la ruta `apps/web/public/logo_riff.png`**
  (copia en build time vía `sync-favicon.mjs`, y `COPY` en el Dockerfile) →
  monorepo controlado; el script avisa sin romper si la fuente falta; si el
  acople molesta, el fallback documentado es duplicar el archivo (deuda menor,
  explícita).
- **[R7] Build local de admin sin args explícitos ahora falla o genera vacíos**
  → comportamiento deseado (determinismo); la documentación de
  `docs/deploy-standards.md` incluye los comandos locales de prueba.
- **[R8] Los pines de `@img/*` pueden desfasar si sharp sube de versión**
  (sharp declara sus propios optionals con versión exacta) → bump conjunto con
  sharp; un pin desfasado es peso muerto, no rompe (npm resuelve el binding
  correcto vía los optionals de sharp), y el fail-fast del Dockerfile detecta
  un árbol mal resuelto.

## Plan de migración

1. Merge de este change en una PR única (Dockerfiles + Makefile + CI + favicon
   + docs).
2. Tras el merge: configurar en Coolify las Build Variables de
   `riff-admin-staging` (y luego prod) con las 5 variables documentadas.
3. Verificar que ambos deploys de Coolify completan; correr smokes de staging
   (`SMOKE_WEB_URL`/`SMOKE_ADMIN_URL`/`SMOKE_API_URL`).
4. Rollback: revertir el commit de la PR; los Dockerfiles anteriores eran
   roto-en-Coolify, así que el rollback solo aplica si el nuevo estado rompiera
   algo que antes funcionaba (p. ej., el gate de CI) — se revierte el job de CI
   de forma independiente si hiciera falta.

## Preguntas abiertas

- **Q1 (resuelta 2026-10-12)**: el log completo de Coolify muestra
  `MissingSharp: Could not find Sharp. Please install Sharp (`sharp`) manually
  into your project...` — ver Contexto.
- **Q2 (resuelta 2026-10-12)**: arquitectura del host de Coolify = `x86_64`
  (`uname -m` en el VPS).
- **Q3**: ¿Se publica la URL de staging de la API (`*.run.app`) para poder
  replicar en CI el build con `REQUIRE_API=true`? (follow-up opcional; hoy vive
  solo en secretos).
