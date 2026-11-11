## Why

El sitio público (Astro, `apps/web`) hoy solo se construye en CI: no existe ningún mecanismo de publicación, por lo que llevar una versión a `staging.somosriff.cl` exige una subida manual por FTP que no es reproducible ni auditable. En el hosting compartido (LiteSpeed/cPanel) la publicación es por FTP y el contrato de `.htaccess` ya está validado contra el build real, así que hace falta un flujo de despliegue versionado en GitHub Actions que construya el sitio, lo publique por FTPES de forma ordenada y verifique el resultado.

## What Changes

- Se añade un workflow de GitHub Actions de despliegue manual (`workflow_dispatch` únicamente) para el sitio público `apps/web`.
- El build se ejecuta sin Docker: Node 24 en `ubuntu-latest`, `npm ci` en la raíz del monorepo y `npm run build --workspace=@riff/web` con `SITE_URL=https://staging.somosriff.cl`, `NESTJS_API_URL`, `PUBLIC_API_URL` y `REQUIRE_API=true` tomados del GitHub Environment `staging`.
- La publicación se hace por FTPES (puerto 21, `ftp:ssl-force`, `ftp:ssl-protect-data`, modo pasivo, `--parallel=2`) con `lftp` instalado en el runner vía `apt-get`, sin modificar `package-lock.json`.
- La subida es ordenada para no dejar el sitio inconsistente: primero los assets con hash (`_astro/`), después el resto del contenido, y solo al final el borrado de ficheros HTML obsoletos; los assets antiguos no se borran en el mismo despliegue.
- La limpieza de HTML obsoleto está acotada al espacio del sitio publicado (raíz y directorios presentes en el `dist/` local), excluye `.well-known/`, `cgi-bin/` y las carpetas ajenas de la cuenta FTP (`Gabriel2/`, `gabriel2/`), nunca borra ficheros que no sean `.html` y está protegida por guardas previas (build mínimo válido y umbrales de volumen) que abortan sin borrar nada, registrando la lista de rutas antes de eliminar.
- Se garantiza la publicación de dotfiles (`.htaccess` de la raíz y de `_astro/`) mediante `set glob:dot 1`.
- Las credenciales se toman de secrets del GitHub Environment `staging` (`FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`), nunca del repositorio ni de los logs; el workflow falla con un mensaje claro si falta alguna.
- Gates: antes de subir se ejecuta `npm run verify:htaccess --workspace=@riff/web` contra `dist/`; después de subir se ejecuta el smoke del sitio (`scripts/smoke/web.mjs` con `SMOKE_WEB_URL`) y un `curl -I` a la home y a un asset de `_astro/`.
- La primera tarea del change es un job manual de solo lectura que se conecta por FTPES y lista el directorio remoto, para descartar que el firewall del hosting bloquee las IP de GitHub Actions antes de escribir nada.
- Se documenta el runbook de despliegue manual por FTP (lanzamiento, rollback y delta de specs del cambio de modelo de despliegue).
- Cambia el modelo de despliegue del sitio público de staging: pasa del carril retirado de Coolify (servicios de staging eliminados) a GitHub Actions + FTPES. El panel de administración, el backend, producción y las carpetas ajenas de la cuenta FTP quedan fuera de alcance.

## Capabilities

### New Capabilities

- `web-ftp-deployment`: pipeline de publicación del sitio público `apps/web` en el hosting por FTPES desde GitHub Actions (build sin Docker, credenciales por secrets, orden de subida, gates previos y posteriores, rollback y runbook).

### Modified Capabilities

- `deployment-architecture`: el sitio público de staging se publica desde GitHub Actions por FTPES y la arquitectura deja de presentar Coolify (retirado del staging) como plataforma vigente.
- `fix-deploy-pipeline-gates`: los gates del pipeline se redefinen para el nuevo carril (despliegue manual con `workflow_dispatch`, sin `workflow_run` ni `repository_dispatch`, build con `REQUIRE_API=true`, smoke y verificación de `.htaccess` antes y después de la subida) y se retira el requisito de webhooks de Coolify, ya sin servicios que los invoquen.

## Impact

- **Código y configuración**: nuevo workflow en `.github/workflows/` (p. ej. `deploy-web-staging.yml`) y un script de limpieza acotada (`scripts/deploy/cleanup-stale-html.sh`), sin cambios en el código de la aplicación; `apps/web`, su `Dockerfile`, `nginx.conf` y `package-lock.json` quedan intactos.
- **Infraestructura externa**: GitHub Environment `staging` con variables de build y secrets `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`; carpeta `staging.somosriff.cl` del hosting cPanel/LiteSpeed como destino.
- **Documentación**: `docs/deploy-standards.md` (runbook de despliegue manual por FTP, rollback, acotado de la limpieza y advertencia sobre las carpetas ajenas de la cuenta FTP) y delta de specs `deployment-architecture` y `fix-deploy-pipeline-gates`.
- **Fuera de alcance**: panel Angular, backend, despliegue a producción, reactivación de servicios de Coolify y cualquier carpeta de la cuenta FTP ajena al sitio publicado.
