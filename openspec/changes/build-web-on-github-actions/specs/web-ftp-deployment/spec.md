## ADDED Requirements

### Requirement: El despliegue del sitio público SHALL ser manual y disparado por workflow_dispatch

El repositorio SHALL contener un workflow de GitHub Actions que despliegue el sitio público (`apps/web`) al hosting de `staging.somosriff.cl`. El workflow SHALL dispararse únicamente mediante `workflow_dispatch`, de modo que el operador elija explícitamente la rama y el commit a publicar. El workflow SHALL NOT disparar por `workflow_run`, por `repository_dispatch` ni por ningún evento automático de `push` o `pull_request`; el disparo automático del sitio público se activará en un ciclo posterior. El workflow SHALL usar el grupo de concurrencia `deploy-web-staging` con `cancel-in-progress: false`, de modo que una subida FTP en curso no se interrumpa.

#### Scenario: El operador lanza el despliegue manualmente

- **WHEN** un operador lanza el workflow desde la pestaña Actions eligiendo una rama
- **THEN** el workflow hace checkout del commit de esa rama y publica ese build en el hosting

#### Scenario: El workflow no se activa solo

- **WHEN** ocurre un `push` a `main` o se abre un `pull_request`
- **THEN** el workflow de publicación del sitio público no se dispara

#### Scenario: Dos despliegues simultáneos no se cancelan

- **WHEN** hay una ejecución del grupo `deploy-web-staging` en curso y se lanza otra
- **THEN** la segunda ejecución espera y la primera no se cancela

### Requirement: El build del sitio público SHALL ejecutarse sin Docker en el runner

El workflow SHALL construir el sitio público directamente en el runner, sin usar Docker ni `make docker-build`: SHALL usar `ubuntu-latest`, SHALL instalar Node 24, SHALL ejecutar `npm ci` en la raíz del monorepo y SHALL ejecutar `npm run build --workspace=@riff/web`. El build SHALL recibir `SITE_URL=https://staging.somosriff.cl`, `NESTJS_API_URL`, `PUBLIC_API_URL` y `REQUIRE_API=true`, con los valores tomados del GitHub Environment `staging`. El build SHALL NOT modificar `package-lock.json` ni el código de la aplicación.

#### Scenario: El build usa las variables del environment staging

- **WHEN** se ejecuta el job de build
- **THEN** el build de `@riff/web` se invoca con `SITE_URL=https://staging.somosriff.cl`, las URL de API de staging en `NESTJS_API_URL` y `PUBLIC_API_URL`, y `REQUIRE_API=true`

#### Scenario: El build falla si la API de staging no responde

- **WHEN** la API de staging no está disponible o devuelve un catálogo vacío durante el build
- **THEN** el build falla y no se sube ningún fichero al hosting

#### Scenario: La instalación no altera el lockfile

- **WHEN** el job instala dependencias con `npm ci`
- **THEN** `package-lock.json` no se modifica y `lftp` no se añade como dependencia del proyecto

### Requirement: La publicación SHALL realizarse por FTPES con lftp

La publicación SHALL usar `lftp` instalado en el runner con `apt-get`, sin tocar `package-lock.json`. La conexión SHALL usar FTPES con TLS forzado (`ftp:ssl-force`), cifrado de datos (`ftp:ssl-protect-data`), puerto 21 y modo pasivo. La subida SHALL usar `--parallel=2` y SHALL habilitar `set glob:dot 1` (o una subida explícita equivalente) para que los dotfiles del build lleguen siempre al hosting. Las credenciales SHALL tomarse de los secrets `FTP_HOST`, `FTP_USER` y `FTP_PASSWORD` del GitHub Environment `staging`; los valores SHALL estar enmascarados y SHALL NOT aparecer en los logs, en los comandos impresos ni en el repositorio. El destino es la raíz de la cuenta FTP, que es la raíz de documentos de `staging.somosriff.cl`. La cuenta FTP puede contener carpetas ajenas al sitio publicado, cuyo contenido se desconoce y no forma parte de este change.

#### Scenario: La conexión exige TLS

- **WHEN** el workflow abre la sesión FTP
- **THEN** la conexión usa el puerto 21 con `ftp:ssl-force` y `ftp:ssl-protect-data` activos y en modo pasivo

#### Scenario: Los dotfiles se publican

- **WHEN** se sube el contenido del build
- **THEN** el `.htaccess` de la raíz del sitio y el `.htaccess` de `_astro/` aparecen en el hosting

#### Scenario: Las credenciales no se filtran

- **WHEN** el workflow falla durante la conexión o la subida
- **THEN** ningún log contiene el host, el usuario ni la contraseña de FTP

#### Scenario: Falta un secret

- **WHEN** alguno de los secrets `FTP_HOST`, `FTP_USER` o `FTP_PASSWORD` no está definido en el environment `staging`
- **THEN** el workflow falla antes de intentar publicar, con un mensaje claro que indica qué secret falta

### Requirement: La subida SHALL preservar la consistencia del sitio publicado

El workflow SHALL subir primero los assets con hash (`_astro/`), después el resto del contenido del build, y SHALL borrar los ficheros obsoletos solo al final y solo cuando sean documentos HTML. Los assets antiguos con hash SHALL NOT borrarse en el mismo despliegue, para que las páginas ya cacheadas en los navegadores sigan resuelviendo sus referencias. El borrado de HTML obsoleto SHALL ocurrir únicamente después de que el contenido nuevo esté subido.

#### Scenario: Los assets con hash se publican primero

- **WHEN** el workflow ejecuta la fase de subida
- **THEN** el directorio `_astro/` del build se sube antes que el resto de ficheros del build

#### Scenario: El HTML obsoleto se borra al final

- **WHEN** la subida del contenido nuevo ha terminado correctamente
- **THEN** el workflow elimina del hosting los documentos HTML obsoletos que ya no existen en el build

#### Scenario: Los assets antiguos se conservan

- **WHEN** un despliegue deja obsoletos ficheros de `_astro/`
- **THEN** esos ficheros no se borran durante ese mismo despliegue

### Requirement: El borrado de HTML obsoleto SHALL limitarse al espacio del sitio publicado

La limpieza de documentos HTML obsoletos SHALL limitarse a la raíz del sitio y a los directorios que existan también en el `dist/` local del build (por ejemplo `productos/` o `categorias/`). La limpieza SHALL NOT tocar directorios remotos que no existan en el `dist/` local, y SHALL excluir explícitamente `.well-known/`, `cgi-bin/` y cualquier otra carpeta ajena al sitio publicado que exista en la cuenta FTP (como `Gabriel2/` o `gabriel2/`), cuyo contenido se desconoce. La limpieza SHALL NOT eliminar ningún fichero que no sea un documento `.html`; los assets, imágenes, hojas de estilo, scripts y ficheros de configuración del hosting SHALL permanecer intactos.

#### Scenario: Solo se limpian los directorios del build

- **WHEN** la limpieza encuentra documentos HTML obsoletos en directorios presentes en el `dist/` local
- **THEN** esos documentos se eliminan y la limpieza no sale de la raíz del sitio ni de esos directorios

#### Scenario: Las carpetas ajenas al sitio no se tocan

- **WHEN** la cuenta FTP contiene un directorio que no existe en el `dist/` local, como `Gabriel2/`, `gabriel2/`, `cgi-bin/` o `.well-known/`
- **THEN** el workflow no borra ningún fichero de esos directorios

#### Scenario: Solo se eliminan documentos HTML

- **WHEN** la limpieza encuentra un fichero obsoleto que no es `.html`
- **THEN** ese fichero se conserva en el hosting

### Requirement: La limpieza de HTML obsoleto SHALL estar protegida por guardas y registrada en el log

Antes de borrar nada, el workflow SHALL validar el build y SHALL abortar la limpieza sin eliminar ningún fichero si se cumple alguna de estas condiciones:

- el `dist/` local no contiene `index.html`;
- el `dist/` local no contiene `404.html`;
- el `dist/` local no contiene un número mínimo razonable de documentos HTML (al menos 5 documentos HTML en total);
- el número de ficheros a borrar supera el umbral absoluto (más de 20 ficheros) o el umbral relativo (más del 30 % de los documentos HTML presentes en el hosting).

Cuando una guarda se active, el workflow SHALL terminar en estado fallido (rojo) aunque la subida previa ya se haya completado, mostrando el motivo concreto de la guarda que se incumplió en el log y en el resumen del job (job summary), y SHALL NOT borrar ningún fichero. Antes de ejecutar el borrado, el workflow SHALL registrar en el log la lista completa de rutas que va a eliminar, mostrando únicamente rutas relativas y nunca credenciales ni URLs con usuario o contraseña.

#### Scenario: El build incompleto aborta la limpieza

- **WHEN** el `dist/` no contiene `index.html`, `404.html` o no alcanza el mínimo de documentos HTML
- **THEN** el workflow falla indicando qué guarda se incumplió y no borra ningún fichero del hosting

#### Scenario: Un volumen anómalo de borrado aborta la limpieza

- **WHEN** los ficheros a borrar superan 20 ficheros o el 30 % de los documentos HTML remotos
- **THEN** el workflow falla indicando el umbral superado y no borra ningún fichero del hosting

#### Scenario: La lista de borrado queda registrada

- **WHEN** la limpieza se va a ejecutar
- **THEN** el log muestra la lista de rutas que se van a eliminar antes de eliminarlas, sin incluir credenciales

### Requirement: El contrato del workflow SHALL estar cubierto por tests automatizados

El repositorio SHALL incluir tests automatizados que verifiquen el contrato del workflow de publicación del sitio público. Los tests SHALL comprobar, como mínimo: que el workflow solo se dispara con `workflow_dispatch`, que el grupo de concurrencia y `cancel-in-progress` son los fijados, que los permisos del `GITHUB_TOKEN` son mínimos, que las acciones están fijadas por SHA, que la verificación de `.htaccess` precede a la subida, que la configuración FTPES es la exigida, que la limpieza de HTML está limitada al espacio del sitio publicado, que las guardas de la limpieza están presentes y que el log de la limpieza se emite antes del borrado. Los tests SHALL formar parte del gate de CI del proyecto.

#### Scenario: Los tests cubren las guardas de la limpieza

- **WHEN** se revisa la suite de tests del contrato del workflow
- **THEN** existen casos que fallan si desaparecen las guardas de la limpieza, el acotado del borrado o el registro previo de la lista de ficheros

#### Scenario: El gate ejecuta los tests del workflow

- **WHEN** se ejecuta el gate de CI del proyecto
- **THEN** la suite del contrato del workflow se ejecuta y su fallo hace fallar el gate

### Requirement: El workflow SHALL exponer un modo de ejecución que por defecto no publica

El workflow SHALL declarar un input `mode` de tipo `choice` con las opciones `listar` y `desplegar`, y SHALL usar `listar` como valor por defecto. En el modo `listar` el workflow SHALL limitarse a comprobar el acceso y listar el directorio remoto, y SHALL NOT escribir, sobrescribir ni borrar nada en el hosting. El build y la publicación SHALL ejecutarse únicamente cuando el modo seleccionado sea `desplegar`. Mientras la fase de publicación no esté implementada, seleccionar `desplegar` SHALL terminar el job en estado fallido con un mensaje explícito que indique que esa fase todavía no existe, y SHALL NOT escribir nada en el hosting.

El modo por defecto SHALL ser `listar` porque el botón "Run workflow" solo aparece cuando el fichero del workflow existe en la rama por defecto: la primera versión mergeada a `main` no debe poder modificar el hosting por un descuido de quien la lance.

#### Scenario: El modo por defecto solo lista

- **WHEN** un operador lanza el workflow sin cambiar el modo
- **THEN** el modo es `listar` y el workflow se limita a comprobar el acceso y listar el directorio remoto

#### Scenario: El modo listar no escribe en el hosting

- **WHEN** el workflow se ejecuta en modo `listar`
- **THEN** no se sube, sobrescribe ni borra ningún fichero del hosting

#### Scenario: El modo desplegar falla mientras no exista la fase de publicación

- **WHEN** un operador selecciona el modo `desplegar` en una versión del workflow que todavía no implementa la publicación
- **THEN** el job termina en estado fallido con un mensaje explícito y no se escribe nada en el hosting

### Requirement: El workflow SHALL verificar el build antes de publicar y el sitio después de publicar

Antes de la subida, el workflow SHALL ejecutar `npm run verify:htaccess --workspace=@riff/web` contra el `dist/` generado y SHALL abortar si la verificación falla. Después de la subida, el workflow SHALL ejecutar el smoke test del sitio (`scripts/smoke/web.mjs` con `SMOKE_WEB_URL`) y SHALL verificar con `curl -I` la home del sitio y un asset de `_astro/`. Cualquier fallo de estas comprobaciones SHALL marcar el workflow como fallido.

#### Scenario: La verificación del .htaccess bloquea la subida

- **WHEN** `npm run verify:htaccess --workspace=@riff/web` falla contra el build
- **THEN** el workflow se detiene y no se sube ningún fichero al hosting

#### Scenario: El smoke del sitio falla tras la publicación

- **WHEN** el smoke test del sitio devuelve un error tras la subida
- **THEN** el workflow queda en estado fallido y la incidencia queda visible en la ejecución

#### Scenario: La home y un asset responden correctamente

- **WHEN** la subida termina
- **THEN** `curl -I` sobre la home y sobre un asset de `_astro/` devuelve respuestas HTTP exitosas

### Requirement: El acceso de lectura al hosting SHALL verificarse antes de la primera escritura

La primera implementación del workflow SHALL incorporar un job manual de solo lectura que, desde un runner de GitHub, se conecte por FTPES y liste el directorio remoto del hosting sin escribir ni borrar nada. Ese job SHALL corresponderse con el modo `listar`, que es el valor por defecto. Si esa conexión o listado falla, el workflow SHALL detenerse y SHALL informar del fallo, de modo que un bloqueo del firewall del hosting contra las IP de GitHub Actions se detecte antes de intentar cualquier publicación.

#### Scenario: El listado remoto funciona

- **WHEN** el job de comprobación se ejecuta con credenciales válidas
- **THEN** el job lista el directorio remoto y termina correctamente sin escribir nada

#### Scenario: El firewall bloquea al runner

- **WHEN** la conexión FTPES o el listado remoto falla
- **THEN** el workflow se detiene antes de cualquier subida y el error indica que el acceso al hosting no está disponible

### Requirement: El workflow SHALL aplicar mínimo privilegio y no exponer credenciales

El workflow SHALL declarar `permissions: contents: read` como permiso del `GITHUB_TOKEN` y SHALL NOT declarar permisos adicionales. Las acciones de terceros que se usen, incluidas las oficiales de GitHub, SHALL estar fijadas por el SHA completo del commit, no por una etiqueta flotante. Los secrets SHALL provenir del GitHub Environment `staging` y SHALL NOT estar almacenados en el repositorio ni expuestos como variables de salida del workflow.

#### Scenario: Los permisos del token son mínimos

- **WHEN** se revisa la definición del workflow
- **THEN** el único permiso del `GITHUB_TOKEN` es `contents: read`

#### Scenario: Las acciones están fijadas por SHA

- **WHEN** se revisan los pasos del workflow que usan acciones de terceros
- **THEN** cada una referencia un SHA completo de commit

### Requirement: El runbook de despliegue manual por FTP SHALL estar documentado

`docs/deploy-standards.md` SHALL documentar el procedimiento de despliegue manual del sitio público por FTP: cómo lanzar el workflow, qué variables y secrets exige el GitHub Environment `staging`, cómo verificar el resultado y cómo ejecutar el rollback. El rollback del sitio público SHALL consistir en volver a subir el build anterior, y el runbook SHALL indicar cómo recuperar ese build. La documentación SHALL registrar además el delta de modelo de despliegue introducido por este cambio sobre las specs `deployment-architecture` y `fix-deploy-pipeline-gates`, y SHALL advertir de que la cuenta FTP contiene carpetas ajenas al sitio que el despliegue nunca modifica.

#### Scenario: El runbook permite lanzar el despliegue

- **WHEN** un operador necesita publicar el sitio público en staging
- **THEN** el runbook indica los pasos exactos para lanzar el workflow y qué revisar en la salida

#### Scenario: El runbook permite revertir

- **WHEN** un despliegue deja el sitio en un estado incorrecto
- **THEN** el runbook explica cómo volver a subir el build anterior y qué comprobaciones ejecutar después del rollback

#### Scenario: El runbook advierte de las carpetas ajenas

- **WHEN** se revisa el runbook
- **THEN** documenta que existen directorios de la cuenta FTP ajenos al sitio y que el despliegue no los modifica
