## Context

El sitio público es una aplicación Astro SSG (`apps/web`) que se construye con `npm run build --workspace=@riff/web` y produce un `dist/` estático. El hosting real del cliente es cPanel/LiteSpeed (`staging.somosriff.cl`), donde el contrato de cabeceras y caché vive en los `.htaccess` que Astro copia desde `apps/web/public/` al `dist/` (raíz y `_astro/`), ya verificado empíricamente en el change archivado `2026-11-09-hosting-litespeed-htaccess`. La cuenta FTP de cada subdominio aterriza directamente en la raíz de documentos, por lo que no hay que cambiar de directorio para publicar.

Hoy el repositorio solo tiene un workflow, `.github/workflows/ci.yml` (push/PR a `main`, `permissions: contents: read`, `actions/checkout@v5` y `actions/setup-node@v5` por etiqueta), y ninguna publicación automatizada: el sitio se sube a mano por FTP. Los servicios de Coolify del staging fueron eliminados, de modo que Coolify ya no forma parte de la arquitectura vigente: `docs/deploy-standards.md` describe todavía ese carril obsoleto y las specs `deployment-architecture` y `fix-deploy-pipeline-gates` fijan que el sitio público de staging se despliega de forma nativa por Coolify vía su GitHub App y que no exista un workflow de deploy en Actions.

La cuenta FTP del hosting contiene, además del sitio publicado, carpetas ajenas a este (`Gabriel2/`, `gabriel2/`), cuyo contenido se desconoce y que no pertenecen al sitio público.

Hechos verificados en el repositorio (base de las decisiones, no supuestos):

- `apps/web/package.json:10-22` expone `build` (`astro build`) y `verify:htaccess` (`node scripts/verify-htaccess.mjs`), sin hooks `pre`/`post` de `build`.
- `apps/web/scripts/verify-htaccess.mjs:45-46` valida `apps/web/dist/.htaccess` y `apps/web/dist/_astro/.htaccess` contra el contrato; sale con código 1 si falta el `dist/` o si hay desviaciones.
- `scripts/smoke/web.mjs:15,29-33` usa `SMOKE_WEB_URL`; si no está definida es un no-op con exit 0; valida home, `/productos`, un detalle de producto y un asset `/_astro/*`.
- `apps/web/astro.config.mjs:14-16` lee `SITE_URL`; `src/lib/api/apiBaseUrl.ts:51-60` activa el fallo de build solo con `REQUIRE_API === 'true'`; `src/lib/forms/formSubmitClient.ts:62` consume `PUBLIC_API_URL`.
- `package.json:28-31` exige Node >= 24 y fija `npm@10.9.8`; `postinstall` compila `@riff/html-sanitize`.
- `.github/` no contiene ningún environment, secret ni workflow de despliegue; `ci.yml` es el único workflow y no usa secrets.
- No existe en el repo ningún nombre de secret de FTP: se definen en este change (`FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`).

Restricciones fijadas para este ciclo:

- Alcance: solo el sitio público `apps/web` hacia `staging.somosriff.cl`. Fuera: panel Angular, backend, producción y cualquier reactivación de servicios de Coolify (retirados del staging).
- Build sin Docker, Node 24 en `ubuntu-latest`, `npm ci` en la raíz, `npm run build --workspace=@riff/web`.
- Variables `SITE_URL`, `NESTJS_API_URL`, `PUBLIC_API_URL` y `REQUIRE_API=true` desde un GitHub Environment `staging`.
- Solo `workflow_dispatch`; sin `workflow_run` ni `repository_dispatch`.
- Concurrencia `deploy-web-staging` con `cancel-in-progress: false`.
- Subida FTPES con `lftp` instalado por `apt-get`, sin tocar `package-lock.json`; puerto 21, `ftp:ssl-force`, `ftp:ssl-protect-data`, pasivo, `--parallel=2`, dotfiles siempre.
- Orden de subida: `_astro/` primero, después el resto, y borrado de HTML obsoleto solo al final, acotado al espacio del sitio publicado y protegido por guardas; los assets viejos no se borran.
- Gates: `verify:htaccess` antes de subir; smoke del sitio y `curl -I` a home y a un asset de `_astro/` después de subir.
- La primera tarea es un job manual de solo lectura que se conecta por FTPES y lista el directorio remoto; si falla, para y avisa.

## Goals / Non-Goals

**Goals:**

- Publicar el sitio público de staging desde GitHub Actions de forma manual, reproducible y auditable.
- Reutilizar el build y los scripts de verificación ya existentes (`verify:htaccess`, `scripts/smoke/web.mjs`) como gates del pipeline.
- Garantizar que el hosting nunca queda inconsistente a mitad de despliegue (assets primero, HTML obsoleto al final).
- Acotar la limpieza al espacio del sitio publicado, de modo que las carpetas ajenas de la cuenta FTP (`Gabriel2/`, `gabriel2/`, `.well-known/`, `cgi-bin/`) nunca se toquen.
- Impedir borrados masivos o accidentales mediante guardas previas sobre el build y sobre el volumen de ficheros a eliminar.
- Mantener las credenciales exclusivamente en secrets del GitHub Environment `staging`, sin filtrarlas a los logs.
- Detectar pronto un bloqueo de red del hosting contra las IP de GitHub Actions, antes de escribir nada.
- Documentar el runbook (lanzamiento, rollback) y el delta de modelo de despliegue en las specs y en `docs/deploy-standards.md`.

**Non-Goals:**

- Automatizar el disparo del despliegue (queda para un ciclo posterior con `workflow_run`).
- Desplegar a producción.
- Tocar el panel Angular, el backend o su infraestructura de despliegue.
- Reactivar servicios de Coolify u otros webhooks de plataformas retiradas.
- Limpiar el hosting de ficheros obsoletos distintos de HTML, o borrar assets antiguos con hash.
- Inspeccionar, modificar o limpiar las carpetas de la cuenta FTP ajenas al sitio publicado.
- Introducir una herramienta de despliegue propia en Node: la publicación la hace `lftp` desde el runner.
- Modificar `apps/web`, su `Dockerfile`, `nginx.conf`, `.htaccess` o `package-lock.json`.

## Decisions

### D1 — Un único workflow manual, con un job de comprobación de acceso y un job de publicación

Se crea `.github/workflows/deploy-web-staging.yml` con `on: workflow_dispatch` y dos jobs:

1. `ftp-access-check`: instala `lftp` y se conecta por FTPES para **listar** el directorio remoto, sin escribir ni borrar. Es el job que materializa la "primera tarea" exigida.
2. `publish`: depende de `ftp-access-check` (`needs:`), y contiene build → verificación → subida → limpieza acotada → verificación post-subida.

**Modo de ejecución.** El workflow declara un input `mode` (`choice`) con las opciones `listar` y `desplegar`, con `listar` por defecto. El job `ftp-access-check` se ejecuta en ambos modos; el job `publish` solo se ejecuta con `mode == 'desplegar'`. Mientras `publish` no esté implementado, elegir `desplegar` termina el job en rojo con un mensaje explícito y no escribe nada.

El motivo es factual: según la documentación de GitHub, el botón "Run workflow" solo aparece si el fichero del workflow existe en la rama por defecto, y una vez que el workflow haSeeder ejecutado al menos una vez se puede lanzar contra cualquier rama o tag mediante la API o la CLI (`gh workflow run deploy-web-staging.yml --ref <rama>`). Es decir: mientras el workflow no esté en `main`, no se puede lanzar desde una rama de trabajo, ni por UI ni por CLI. Como la primera versión que se mergea a `main` es la que se usaría para el primer despliegue real, el modo por defecto `listar` garantiza que esa primera ejecución no pueda escribir ni borrar nada en el hosting por un descuido.

Alternativas descartadas:

- *Un solo job con un paso inicial de listado*: mezcla un gate de red con la publicación y hace más difícil reintentar solo la publicación sin repetir la comprobación.
- *Dos workflows separados*: duplicaría la definición de secrets/environment y obligaría a orquestarlos a mano.
- *Un flag `dry_run` en el `workflow_dispatch`*: la comprobación de acceso debe ser siempre obligatoria, no optativa.
- *Dejar la primera versión mergeada con capacidad de escritura*: un lanzamiento accidental desde la UI publicaría sobre el hosting sin la verificación de acceso previa.

El job `ftp-access-check` falla con un mensaje explícito ("no se pudo conectar/listar el hosting por FTPES: revisar firewall del hosting y credenciales") y, al ser dependencia de `publish`, impide cualquier escritura.

### D2 — Build sin Docker en el runner

El job `publish` usa `ubuntu-latest` + Node 24, ejecuta `npm ci` en la raíz y `npm run build --workspace=@riff/web`. El `Dockerfile` de `apps/web` existe para el carril de contenedores con nginx, que este change no toca: usar Docker en Actions exigiría publicar la imagen en un registry, otra dependencia y más tiempo de runner.

Consecuencia aceptada: `make docker-build` y el carril de contenedores siguen intactos y ambos carriles coexisten; el `.htaccess` del `dist/` sigue siendo la fuente de verdad del contrato en el hosting.

### D3 — Variables de build desde el GitHub Environment `staging`

El job declara `environment: staging`, de modo que los secrets y las variables de environment quedan disponibles y protegidos. `SITE_URL`, `NESTJS_API_URL` y `PUBLIC_API_URL` se leen de las **variables** del environment (`vars.*`) y `REQUIRE_API=true` se fija en el workflow, porque su valor no es un parámetro por entorno en este ciclo.

Se usa `REQUIRE_API=true` (y no el valor por defecto tolerante) porque la publicación al hosting debe fallar si la API de staging no responde o devuelve un catálogo vacío: publicar un sitio sin catálogo dejaría el staging en un estado engañoso, y la URL de la API de staging solo existe como dato de environment, no hardcodeada en el repo.

El workflow valida explícitamente que `SITE_URL`, `NESTJS_API_URL` y `PUBLIC_API_URL` estén definidas y aborta con un mensaje claro si falta alguna; el fallo por API caída lo produce el propio build de Astro.

### D4 — FTPES con `lftp` instalado por `apt-get`

`lftp` es cliente nativo de FTP/FTPES con control fino de TLS, modo pasivo, paralelismo y globbing de dotfiles. Se instala en el runner con `apt-get install -y lftp`, sin añadirlo a `package.json` ni a `package-lock.json` (el requisito explícito de no tocar el lockfile).

Configuración de la sesión:

- `set ftp:ssl-allow no` + `set ftp:ssl-force yes` (TLS obligatorio en el canal de control),
- `set ftp:ssl-protect-data yes` (cifrado del canal de datos),
- `set ftp:port 21`,
- `set ftp:passive-mode yes`,
- `set net:max-retries 3` y `set net:timeout 30` para que un fallo de red no deje el job colgado.

La contraseña se inyecta en el proceso mediante el mecanismo de credenciales de `lftp` (`user`/`pass` leídos de variables de entorno-expanded), sin interpolarla en un comando impreso: el workflow usa `lftp` con un fichero de comandos generado en el runner y nunca hace `echo` del valor.

### D5 — Dotfiles: `set glob:dot 1` y subida explícita del `.htaccess`

Por defecto `lftp` ignora los ficheros que empiezan por `.` al resolver globs, lo que dejaría sin publicar `.htaccess` (raíz y `_astro/`). Se activa `set glob:dot 1` y, además, la subida de los dotfiles críticos se hace de forma explícita (`put`/`mirror` con esos ficheros concretos), de modo que el contrato LiteSpeed no dependa de una única opción de globbing.

La verificación previa `npm run verify:htaccess --workspace=@riff/web` confirma que `dist/.htaccess` y `dist/_astro/.htaccess` existen y cumplen el contrato antes de que se intente subirlos.

### D6 — Orden de subida, borrado acotado del HTML obsoleto y guardas previas

**Secuencia de publicación:**

1. `_astro/` (assets con hash) — primero, para que el HTML nuevo referencie assets ya disponibles.
2. Resto del build (HTML, imágenes estáticas, `404.html`, `.htaccess` raíz).
3. Borrado de documentos HTML remotos que ya no existen en el build — solo al final y solo `.html`.

**Acotado del borrado.** La cuenta FTP contiene carpetas ajenas al sitio (`Gabriel2/`, `gabriel2/`) cuyo contenido se desconoce, además de directorios de infraestructura de cPanel (`.well-known/`, `cgi-bin/`). Por eso la limpieza:

- solo considera ficheros con extensión `.html` (nunca assets, imágenes, scripts ni ficheros de configuración);
- solo recorre la raíz del sitio y los directorios que **existen también en el `dist/` local** (por ejemplo `productos/`, `categorias/`): el conjunto de directorios candidatos se deriva del propio build, no del listado remoto;
- excluye explícitamente `.well-known/`, `cgi-bin/` y cualquier directorio remoto que no exista en el `dist/`, de modo que las carpetas ajenas nunca se listan para borrado ni se modifican.

En la práctica, el borrado se calcula listando en remoto los `.html` **dentro de los directorios candidatos** (con `lftp find` acotado a cada directorio) y comparándolos con el conjunto de HTML del `dist/`; los que no estén en el build se eliminan. Los assets antiguos de `_astro/` **no** se borran: sus nombres llevan hash, las páginas cacheadas en navegadores pueden seguir pidiéndolos y borrarlos provocaría 404 en clientes cacheados; la acumulación se acepta como coste de la estrategia y su limpieza queda para un ciclo posterior.

**Guardas previas.** Antes de borrar, el workflow aborta **sin borrar nada** si se cumple alguna condición:

- el `dist/` no contiene `index.html`;
- el `dist/` no contiene `404.html`;
- el `dist/` contiene menos de 5 documentos HTML en total (umbral mínimo razonable: un build con 1-4 HTML indica un build truncado o un catálogo vacío);
- el número de ficheros a borrar supera 20 (umbral absoluto) o el 30 % de los documentos HTML presentes en el hosting (umbral relativo).

El motivo se imprime explícitamente en el log y en el resumen del job (`$GITHUB_STEP_SUMMARY`) y el job termina en **rojo**, aunque la subida previa ya se haya completado: una guarda incumplida es un despliegue no validado, y debe quedar visible como fallo en la ejecución, no como un acierto con notas. Los umbrales se declaran como constantes del script de limpieza para que sean ajustables en un único sitio.

**Trazabilidad.** Antes de ejecutar el borrado, el workflow registra la lista completa de rutas relativas que va a eliminar (una por línea). En el log solo aparecen rutas: nunca credenciales, ni URLs con usuario o contraseña.

Alternativas descartadas:

- *`mirror --delete`*: borraría assets antiguos y ficheros no-HTML, rompiendo páginas cacheadas y borrando más de lo que el change permite.
- *Borrado de HTML antes de subir*: dejaría rutas rotas durante la ventana de despliegue.
- *No borrar nunca*: dejaría documentos de rutas eliminadas sirviendo contenido obsoleto.
- *Borrar todo `.html` remoto sin acotar por directorio*: tocaría las carpetas ajenas de la cuenta FTP, cuyo contenido se desconoce.
- *Borrado sin guardas*: un build truncado (por ejemplo, un `404.html` que no se generó) eliminaría páginas válidas del hosting de forma masiva e irreversible.
- *Borrado sin trazar*: un error de configuración dejaría el hosting sin registro de qué se eliminó, sin forma de reconstruir el estado.

### D7 — Gates antes y después de la publicación

- **Antes**: `npm run verify:htaccess --workspace=@riff/web` contra el `dist/`. Si falla, no se sube nada.
- **Después**: `SMOKE_WEB_URL=https://staging.somosriff.cl npm run smoke:web` (que valida home, `/productos`, un detalle de producto y un asset `/_astro/*`) más un `curl -I` explícito a la home y a un asset concreto de `_astro/` (tomado del propio `dist/`), para comprobar también las cabeceras y el `Cache-Control` en el hosting real.

El smoke por sí solo es un no-op si `SMOKE_WEB_URL` no está definido, así que el workflow la define explícitamente en el paso; un `curl -I` adicional no es redundante porque el smoke no valida cabeceras.

### D8 — Concurrencia `deploy-web-staging` sin cancelación

`concurrency: { group: deploy-web-staging, cancel-in-progress: false }`. Con `cancel-in-progress: true` una segunda ejecución podría matar un `lftp` a mitad de la subida y dejar el hosting inconsistente. Con `false`, la segunda ejecución espera a que termine la primera.

### D9 — Mínimo privilegio y acciones fijadas por SHA

`permissions: contents: read` a nivel de workflow (y sin permisos de job adicionales). Las acciones que se usen (`actions/checkout`, `actions/setup-node` y, si se usa, `actions/upload-artifact`) se fijan por el **SHA completo del commit**, no por etiqueta. Los SHAs concretos se resuelven e incrustan durante la implementación, y se anotan en un comentario del propio workflow indicando la versión correspondiente de cada acción.

Los secrets `FTP_HOST`, `FTP_USER` y `FTP_PASSWORD` se validan antes de usarse (fallo rápido con mensaje que nombra el secret que falta) y el workflow nunca los imprime, ni siquiera en el `set` de `lftp`; `set -x` no se usa en los pasos que los tocan.

### D10 — Rollback: volver a subir el build anterior

El rollback del sitio público consiste en volver a lanzar el mismo workflow sobre el commit o la rama conocidos como buenos, lo que reconstruye y vuelve a subir ese build; el borrado final de HTML obsoleto retira los documentos del despliegue fallido, y los assets antiguos nunca se habían borrado. El runbook documenta cómo identificar el commit bueno (último workflow verde y smoke correcto) y qué comprobar después del rollback.

No se persisten artefactos del `dist/` entre ejecuciones: `actions/upload-artifact` con retención larga es una alternativa (rollback sin rebuild) pero añade otra acción externa y su propia política de expiración; se deja como mejora opcional, no como parte de este change.

### D11 — Runbook y delta de specs

`docs/deploy-standards.md` se actualiza con: el modelo de despliegue del sitio público (Actions → FTPES), el procedimiento de lanzamiento, la tabla de variables y secrets del environment `staging`, los gates, el acotado y las guardas de la limpieza, la advertencia de que la cuenta FTP contiene carpetas ajenas al sitio que el despliegue no modifica, el checklist del error log de cPanel/LiteSpeed heredado del change anterior, y el procedimiento de rollback. El panel Angular y el backend se describen sin presentar Coolify (retirado del staging) como plataforma vigente.

Las specs afectadas se actualizan mediante deltas: `deployment-architecture` (retira el requisito "Frontend staging deploys SHALL be handled natively by Coolify...", ya sin servicios que lo respalden; añade el modelo nuevo; ajusta runtime, rollback y documentación para que no se nombre a Coolify como vigente) y `fix-deploy-pipeline-gates` (redefine el gating: `workflow_dispatch` manual, sin `workflow_run`/`repository_dispatch`; `REQUIRE_API=true` en la lane de publicación; elimina el requisito de webhooks de Coolify, ya sin servicios que los invoquen; el lane manual exige API viva). El detalle operativo vive en la nueva capability `web-ftp-deployment`.

### D12 — Verificación de acceso al hosting como primera tarea

Antes de escribir el resto del workflow, la primera tarea de implementación es el job `ftp-access-check` de solo lectura, que es el job del modo `listar` (valor por defecto del input `mode`). Si el firewall del hosting bloquea las IP de los runners de GitHub Actions, el workflow falla en ese job con un mensaje explícito y no se escribe nada; el resultado se comunica antes de continuar con la implementación del job de publicación.

## Risks / Trade-offs

- [El firewall del hosting bloquea las IP de GitHub Actions] → el job `ftp-access-check` lo detecta antes de cualquier escritura; si falla, hay que abrir el acceso en el hosting (fuera del alcance del repo).
- [El build de Astro depende de la API de staging y la API puede estar caída] → `REQUIRE_API=true` hace fallar el build antes de subir; no se publica un sitio sin catálogo.
- [`lftp` ignora dotfiles por defecto y el `.htaccess` no llega al hosting] → `set glob:dot 1` más subida explícita de los dotfiles críticos, y verificación previa con `verify:htaccess` y posterior con `curl -I` sobre las cabeceras.
- [Acumulación indefinida de assets antiguos en `_astro/`] → aceptada: evita 404 en páginas cacheadas; la limpieza queda para un ciclo posterior.
- [El borrado de HTML obsoleto depende de comparar listados remoto/local] → se ejecuta al final y solo sobre `.html`; un fallo de esa fase deja HTML antiguo en el hosting, que es un estado degradado pero no roto (la web sigue sirviendo).
- [La cuenta FTP contiene carpetas ajenas al sitio (`Gabriel2/`, `gabriel2/`) de contenido desconocido] → la limpieza solo recorre la raíz y los directorios presentes en el `dist/` local, excluye `.well-known/` y `cgi-bin/`, y nunca borra nada que no sea `.html`.
- [Un build truncado provocaría un borrado masivo de páginas válidas] → guardas previas (`index.html`, `404.html`, mínimo de 5 HTML, máximo de 20 ficheros o 30 % de los HTML remotos) que abortan sin borrar nada, con el motivo impreso.
- [Un borrado accidental no sería trazable] → la lista completa de rutas a eliminar se registra en el log antes de ejecutar el borrado.
- [Interrupción de la subida a mitad (caída de red) deja una mezcla de versiones] → la concurrencia sin cancelación evita la interrupción por otra ejecución; ante un fallo de red, el rollback (D10) vuelve a subir el build bueno.
- [Los secrets no existen todavía en el environment `staging`] → el workflow falla con un mensaje que nombra el secret ausente; el runbook indica cómo crearlos antes del primer uso.
- [El build en el runner duplica lo que hace el carril Docker y puede divergir del `Dockerfile`] → el `Dockerfile` no se modifica en este change; el contrato funcional del build es el mismo (`npm run build --workspace=@riff/web`), y `verify:htaccess` acota el riesgo sobre el `.htaccess`.
- [El workflow nuevo convive con la spec que exige que `ci.yml` sea el único workflow] → el delta de `deployment-architecture` retira explícitamente esa restricción para el sitio público y documenta que el panel y el backend no usan servicios de Coolify (retirados del staging).

## Migration Plan

1. Configurar en GitHub el environment `staging` con las variables `SITE_URL`, `NESTJS_API_URL`, `PUBLIC_API_URL` y los secrets `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`.
2. Implementar el workflow con el job `ftp-access-check` y lanzarlo manualmente: si falla, parar y avisar (regla del ciclo).
3. Con la conexión verificada, implementar el job `publish` (build → `verify:htaccess` → subida → limpieza acotada con guardas → smoke → `curl -I`).
4. Lanzar el workflow completo en modo manual y verificar en el hosting: `.htaccess` en raíz y en `_astro/`, cabeceras de seguridad, `Cache-Control` inmutable en `_astro/` y `no-cache` en el HTML, `404.html` servible y redirección 301; comprobar en el log la lista de ficheros borrados (o que la limpieza no se ejecutó por guarda).
5. Actualizar `docs/deploy-standards.md` con el runbook y registrar el delta de modelo de despliegue.

**Rollback**: relanzar el workflow sobre el último commit con publicación y smoke correctos (D10). Si el problema es de contenido del repo, revertir el commit del workflow y volver a publicar el build anterior. Si el problema es una limpieza excesiva, los documentos borrados no se pueden recuperar desde el hosting: habría que resubir el build bueno (D10), y las carpetas ajenas nunca se ven afectadas por el acotado (D6).

## Open Questions

- ¿El nombre final del workflow (`deploy-web-staging.yml`) y del grupo de concurrencia (`deploy-web-staging`) son los definitivos? → se asume `deploy-web-staging` y se puede renombrar sin coste.
- ¿La política de retención de HTML obsoleto en el hosting será la de "borrar solo `.html`" a largo plazo, o el hosting acumula rutas y se quiere una revisión periódica? → fuera de alcance en este change.
- ¿Qué contienen exactamente `Gabriel2/` y `gabriel2/`? → irrelevante para el diseño: el despliegue nunca las recorre ni las modifica; se documenta en el runbook para que el operador lo sepa.
- ¿El umbral de HTML mínimo (5) y los umbrales de borrado (20 ficheros / 30 %) son los adecuados para el volumen real del sitio? → se ajustan en las constantes del script de limpieza, sin cambiar el modelo.
