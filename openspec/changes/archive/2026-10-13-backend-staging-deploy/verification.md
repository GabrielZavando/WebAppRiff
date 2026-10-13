# Verification — backend-staging-deploy

> Evidencia de las verificaciones ejecutadas el 2026-10-13 por el operador
> siguiendo `docs/runbooks/backend-staging-cloud-run.md`. El alcance backend
> del change está completo; la verificación end-to-end (login del admin)
> queda bloqueada por un bug del admin fuera de alcance (ver "Estado
> bloqueado" al final).

## 1. Despliegue

- Servicio Cloud Run `riff-api-staging` en el proyecto `riff-catalogo-staging`
  (región `southamerica-west1`), runtime SA
  `riff-api-runtime@riff-catalogo-staging.iam.gserviceaccount.com`
  (`roles/datastore.user` + `roles/storage.objectAdmin`), escalado
  `min-instances=0` / `max-instances=2`, `--allow-unauthenticated`.
- Imagen publicada en Artifact Registry
  `southamerica-west1-docker.pkg.dev/riff-catalogo-staging/riff/riff-backend`
  con tag `sha-<commit>`.
- **URL final**: `https://riff-api-staging-345601325361.southamerica-west1.run.app`

## 2. Smoke de API (`/health`)

```
$ SMOKE_API_URL=https://riff-api-staging-345601325361.southamerica-west1.run.app npm run smoke:api
/health → status: ok, firebase: up
products / categories / subcategories → 200 con arreglo `data`
```

`/health` responde `status: ok` con el ping a Firestore en `up`: la runtime SA
tiene acceso a Firestore (IAM correcto) y el contenedor arrancó con ADC.

## 3. Auth guard (`/api/v1/auth/me` sin token)

```
$ curl -i https://riff-api-staging-345601325361.southamerica-west1.run.app/api/v1/auth/me
HTTP/2 401
Missing authorization header
```

`FirebaseAuthGuard` rechaza peticiones sin token → 401. El backend verifica
tokens del proyecto `riff-catalogo-staging` (mismo proyecto que el admin).

## 4. CORS

```
$ curl -s -i -X OPTIONS https://riff-api-staging-345601325361.southamerica-west1.run.app/api/v1/products \
    -H "Origin: https://admin-staging.somosriff.cl" \
    -H "Access-Control-Request-Method: GET"
→ access-control-allow-origin: https://admin-staging.somosriff.cl
```

Allowlist CORS estricta (`NODE_ENV=production`) aceptando el origen del admin
de staging: OK.

## 5. Estado bloqueado — verificación end-to-end del admin

La verificación de login (tareas 5.2, 6.1 y 6.2; desbloqueo de la 7.5 de
`deploy-docker-hardening`) **no puede ejecutarse todavía**:

- El admin en `https://admin-staging.somosriff.cl/` carga **sin estilos**.
- Causa diagnosticada: Tailwind CSS v4 en el build Docker no detecta los
  archivos fuente (`.html`/`.ts`) y emite ~11 KB de CSS (solo tokens +
  preflight, sin utilidades; en local el mismo build genera ~49 KB).
- Sin CSS el login no es usable, por lo que no se puede autenticar contra el
  backend real.
- El fix (directiva `@source` explícita en
  `apps/admin/src/styles/globals.css`, a confirmar) se resolverá en el change
  `admin-tailwind-docker-fix`, ajeno a este change.

Cuando el admin funcione: ejecutar el login con `soporte@gabrielzavando.cl`,
confirmar `/auth/me` → 200 y cerrar 5.2, 6.1, 6.2 y la tarea 7.5 del change
archivado.
