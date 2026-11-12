## 1. Preparación operativa previa (fuera del repositorio)

- [x] 1.1 Crear el GitHub Environment `staging` en el repositorio con las variables `SITE_URL=https://staging.somosriff.cl`, `NESTJS_API_URL` y `PUBLIC_API_URL` (API de staging en Cloud Run)
- [x] 1.2 Añadir al Environment `staging` los secrets `FTP_HOST`, `FTP_USER` y `FTP_PASSWORD` de la cuenta FTP del sitio público
- [ ] 1.3 Confirmar con el proveedor del hosting que el acceso FTPES (puerto 21) desde las IP de los runners de GitHub Actions está permitido; si no lo está, abrirlo antes de continuar

## 2. Test del contrato del workflow (TDD: test fallido primero)

- [x] 2.1 Crear `scripts/__tests__/deploy-web-staging-workflow.test.mjs` con los casos fallidos que exigen que exista `.github/workflows/deploy-web-staging.yml` con `on: workflow_dispatch` únicamente (sin `workflow_run`, `repository_dispatch`, `push` ni `pull_request`), un input `mode` de tipo `choice` con las opciones `listar` y `desplegar` y con `listar` por defecto, `permissions: contents: read` sin permisos adicionales, `concurrency.group = deploy-web-staging` con `cancel-in-progress: false` y `environment: staging`
- [x] 2.2 Añadir los casos fallidos que exigen que el job de comprobación `ftp-access-check` solo liste el directorio remoto (sin `put`, `rm`, `mirror --delete` ni `mrm`)
- [x] 2.3 Añadir los casos fallidos que exigen que las acciones usadas estén fijadas por SHA completo (40 caracteres hexadecimales) y que no haya ninguna referencia con forma `@vN` o `@main`
- [ ] 2.4 Añadir los casos fallidos del job de publicación: `npm ci` en la raíz, `npm run build --workspace=@riff/web`, `SITE_URL`/`NESTJS_API_URL`/`PUBLIC_API_URL` leídas del environment con `REQUIRE_API=true`, `npm run verify:htaccess --workspace=@riff/web` antes de cualquier invocación de `lftp`, y `SMOKE_WEB_URL` + `curl -I` a la home y a un asset de `_astro/` después de la subida
- [ ] 2.5 Añadir los casos fallidos de la configuración FTPES: `ftp:ssl-force` y `ftp:ssl-protect-data` activos, puerto 21, modo pasivo, `--parallel=2`, `set glob:dot 1`, subida de `_astro/` antes del resto, borrado de HTML obsoleto al final y ausencia de borrado de assets
- [ ] 2.6 Añadir los casos fallidos del acotado de la limpieza: el borrado solo actúa sobre ficheros `.html`, solo sobre la raíz del sitio y los directorios presentes en el `dist/` local, excluye `.well-known/` y `cgi-bin/`, y no recorre ni modifica directorios remotos ausentes en el `dist/` (por ejemplo `Gabriel2/` o `gabriel2/`)
- [ ] 2.7 Añadir los casos fallidos de las guardas previas al borrado: existencia de `index.html` y `404.html` en el `dist/`, mínimo de 5 documentos HTML en el build, máximo de 20 ficheros a borrar y máximo del 30 % de los documentos HTML remotos, con fallo del job en rojo (aunque la subida ya se haya completado) y sin borrar nada
- [ ] 2.8 Añadir los casos fallidos que exigen que la lista de rutas a borrar se registre en el log antes de la eliminación y que el log no contenga credenciales
- [x] 2.9 Añadir los casos fallidos del modo de ejecución: el job de solo lectura se ejecuta en ambos modos, el job de publicación solo con `mode == 'desplegar'`, el modo `desplegar` falla en rojo mientras la publicación no exista, y el job de solo lectura no contiene ningún comando de escritura o borrado
- [x] 2.10 Ejecutar `npx vitest run scripts/__tests__/deploy-web-staging-workflow.test.mjs` y confirmar que los casos fallan por la ausencia del workflow (test rojo)
- [x] 2.11 Exponer el test como script npm `test:workflow` en el `package.json` raíz y encadenarlo en el `Makefile` (target propio antes de `test-ci` dentro de `ci`), sin modificar ningún otro target
- [x] 2.12 Añadir los casos fallidos que exigen el job `publish` con `needs: ftp-access-check` (se implementan junto con la fase de publicación)
- [x] 2.13 Corregir `scripts/deploy/list-remote.sh`: `ftp:ssl-allow yes` (no `no`), sin `ftp:port 21`, `net:idle` en lugar de `net:max-idle`, validación de secrets (sin bordes con espacio ni caracteres de control, fallando nombrando el secret) y credenciales vía `LFTP_PASSWORD`/`--env-password` en lugar de `.netrc`
- [x] 2.14 Añadir tests que impidan reintroducir `ssl-allow no` y variables de lftp inexistentes (`net:max-idle`), que prohíban `.netrc`, que exijan `--env-password` y que validen las variables ejecutando `lftp -c set` cuando lftp esté disponible
- [x] 2.15 Ejecutar `make ci` y `npx openspec validate --all --strict` y confirmar que todo pasa


## 3. Job manual de comprobación de acceso al hosting (primera tarea, solo lectura)

- [x] 3.1 Crear `.github/workflows/deploy-web-staging.yml` con `on: workflow_dispatch` (input `mode` de tipo `choice`: `listar` (por defecto) y `desplegar`), `permissions: contents: read`, `concurrency` (`deploy-web-staging`, `cancel-in-progress: false`), `environment: staging` y el job `ftp-access-check` en `ubuntu-latest`
- [x] 3.2 Implementar en `ftp-access-check`: instalación de `lftp` con `apt-get install -y lftp`, validación de la presencia de `FTP_HOST`, `FTP_USER` y `FTP_PASSWORD` (fallo rápido con mensaje que nombre el secret ausente) y listado del directorio remoto por FTPES sin escribir ni borrar nada
- [x] 3.3 Confirmar que el job de solo lectura usa únicamente `actions/checkout` fijada por SHA completo (no necesita `setup-node` ni ninguna otra acción), con un comentario que indique la versión
- [x] 3.4 Implementar el tratamiento del modo: `listar` (por defecto) solo comprueba el acceso y lista; `desplegar` ejecuta el job `publish` tras `ftp-access-check`; el modo por defecto impide escrituras accidentales en la primera versión en `main`
- [ ] 3.5 Mergear a `main` y lanzar el workflow manualmente desde la UI (el botón "Run workflow" solo aparece con el workflow en la rama por defecto), con el modo por defecto `listar`, y confirmar que el listado remoto se ejecuta correctamente; si la conexión o el listado falla, parar, avisar y no continuar con la implementación de la publicación
- [ ] 3.6 Confirmar en el log del job que no aparecen el host, el usuario ni la contraseña, y que el job no ha escrito ni borrado nada en el hosting
- [ ] 3.7 Verificar, una vez que el workflow se haya ejecutado al menos una vez, que se puede lanzar desde otra rama con `gh workflow run deploy-web-staging.yml --ref <rama> -f mode=listar`

## 4. Job de publicación: build sin Docker

- [x] 4.1 Añadir el job `publish` con `needs: ftp-access-check`, `environment: staging` y `permissions: contents: read`
- [x] 4.2 Implementar el checkout del ref seleccionado en el disparo y la instalación de Node 24 con `actions/setup-node` fijada por SHA
- [x] 4.3 Ejecutar `npm ci` en la raíz del monorepo y comprobar con `git diff --exit-code package-lock.json` que el lockfile no se ha modificado
- [x] 4.4 Exportar `SITE_URL`, `NESTJS_API_URL` y `PUBLIC_API_URL` desde las variables del Environment `staging`, fallando con mensaje claro si alguna no está definida, y fijar `REQUIRE_API=true`
- [x] 4.5 Ejecutar `npm run build --workspace=@riff/web` y comprobar que el build falla (no se publica) si la API de staging no responde o devuelve un catálogo vacío

## 5. Gate previo a la publicación

- [x] 5.1 Ejecutar `npm run verify:htaccess --workspace=@riff/web` contra el `dist/` justo antes de la subida, con fallo que aborte el job sin invocar `lftp`
- [x] 5.2 Comprobar que el build contiene `dist/.htaccess` y `dist/_astro/.htaccess` antes de la publicación

## 6. Publicación por FTPES

- [x] 6.1 Instalar `lftp` en el runner con `apt-get install -y lftp`, sin añadir dependencias al repositorio
- [x] 6.2 Generar el fichero de comandos de `lftp` con `ftp:ssl-force`, `ftp:ssl-protect-data`, puerto 21, modo pasivo, `net:max-retries`/`net:timeout` y `set glob:dot 1`, tomando usuario y contraseña de los secrets sin interpolarlos en un comando impreso ni habilitar trazas
- [x] 6.3 Subir primero el directorio `_astro/` del build, incluyendo `_astro/.htaccess`
- [x] 6.4 Subir después el resto del contenido del build, incluyendo el `.htaccess` de la raíz
- [ ] 6.5 Crear `scripts/deploy/cleanup-stale-html.sh` con la lógica de limpieza: candidatos = raíz del sitio + directorios existentes en el `dist/` local, exclusión explícita de `.well-known/` y `cgi-bin/`, y filtrado previo por extensión `.html`
- [ ] 6.6 Implementar en el script las guardas previas al borrado: exigir `dist/index.html`, `dist/404.html` y al menos 5 documentos HTML en el build; abortar sin borrar si se incumple, con el motivo concreto en el mensaje, en el log y en el resumen del job
- [ ] 6.7 Implementar en el script los umbrales de volumen: abortar sin borrar si los ficheros a eliminar superan 20 o el 30 % de los documentos HTML remotos, informando del umbral superado y terminando el job en rojo
- [ ] 6.8 Hacer que el script registre en el log la lista completa de rutas relativas que va a eliminar antes de ejecutar el borrado, sin incluir credenciales
- [ ] 6.9 Verificar que el script nunca borra un fichero que no sea `.html` ni recorre directorios ausentes del `dist/` local
- [ ] 6.10 Verificar en la salida del job que no se ha impreso ninguna credencial y que el orden de subida fue `_astro/` → resto → borrado de HTML

## 7. Verificación posterior a la publicación

- [x] 7.1 Ejecutar `SMOKE_WEB_URL=https://staging.somosriff.cl npm run smoke:web` y comprobar que el job falla si el smoke falla
- [x] 7.2 Ejecutar `curl -I` contra la home del sitio y contra un asset real de `_astro/` extraído del `dist/`, comprobando el estado HTTP, las cabeceras de seguridad y el `Cache-Control`
- [ ] 7.3 Verificar en el hosting que el `.htaccess` de la raíz y el de `_astro/` están publicados y que el `404.html` se sirve

## 8. Documentación y delta de specs

- [ ] 8.1 Actualizar `docs/deploy-standards.md` con el runbook de despliegue manual por FTP: cómo lanzar el workflow, variables y secrets del Environment `staging`, gates ejecutados, checklist del error log de cPanel/LiteSpeed, el acotado y las guardas de la limpieza, y la retirada del carril Coolify (servicios eliminados del staging)
- [ ] 8.2 Documentar en el runbook el rollback: identificar el último commit con publicación y smoke correctos, volver a lanzar el workflow sobre ese commit y repetir las verificaciones
- [ ] 8.3 Documentar en el runbook que la cuenta FTP contiene carpetas ajenas al sitio (por ejemplo `Gabriel2/` y `gabriel2/`) cuyo contenido se desconoce y que el despliegue nunca las modifica
- [ ] 8.4 Registrar en la documentación el delta de modelo de despliegue de las specs `deployment-architecture` y `fix-deploy-pipeline-gates` (sitio público publicado por Actions/FTPES; panel Angular y backend sin cambios)
- [ ] 8.5 Revisar `docs/project/stack.md` y, si describe el runtime del sitio público como servicio Coolify/nginx, ajustarlo al hosting por FTPES sin tocar la descripción del panel ni del backend

## 9. Gates finales y verificación end-to-end

- [ ] 9.1 Ejecutar `npm run test:workflow` y confirmar que el contrato del workflow se cumple (test verde)
- [ ] 9.2 Ejecutar `make lint`, `make typecheck` y `make test` y confirmar que pasan sin cambios en el código de la aplicación
- [ ] 9.3 Ejecutar `npx openspec validate --all --strict` y confirmar que el change y las specs delta son válidos
- [ ] 9.4 Ejecutar `make docker-build` y confirmar que el carril Docker sigue construyéndose (no se han tocado los Dockerfiles, `nginx.conf` ni los `.htaccess`)
- [ ] 9.5 Lanzar el workflow completo de forma manual y registrar en la entrega el resultado: listado remoto, build, verificación de `.htaccess`, subida y smoke/curl posteriores
- [ ] 9.6 Comprobar que, con un `dist/` incompleto (sin `404.html` o con menos de 5 documentos HTML), la limpieza aborta sin borrar nada y el log muestra el motivo de la guarda
- [ ] 9.7 Comprobar en la salida del job la lista de rutas borradas (o la ausencia de borrado por guarda) y que no se ha tocado ninguna carpeta ajena al sitio
