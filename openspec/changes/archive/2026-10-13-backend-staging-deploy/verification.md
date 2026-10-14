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

## 5. Verificación end-to-end del admin (cerrada 2026-10-13)

La verificación de login (tareas 5.2, 6.1 y 6.2; desbloqueo de la 7.5 de
`deploy-docker-hardening`) se completó tras resolver el bug del CSS del
admin (change `admin-tailwind-docker-fix`: `COPY .postcssrc.json` en el
Dockerfile + `@source` en `globals.css`):

- **Login**: `soporte@gabrielzavando.cl` → redirección a `/profile` con los
  datos del usuario. **OK**.
- **`/api/v1/auth/me`** (GET): **200** con datos del usuario; peticiones al
  backend con header `Authorization: Bearer eyJ...`. **OK**.
- **Backend**: `https://riff-api-staging-345601325361.southamerica-west1.run.app`
  (proyecto `riff-catalogo-staging`).
- **Estilos**: el admin de `https://admin-staging.somosriff.cl/` carga con
  utilidades Tailwind correctas en producción.

- Estado: **verificado**.
- Fecha: 2026-10-13.
- Ejecutor: Gabriel Zavando.
