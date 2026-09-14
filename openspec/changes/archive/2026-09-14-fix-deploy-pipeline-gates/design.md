# Design — fix-deploy-pipeline-gates

## Contexto

`deploy.yml` hoy se dispara por `push: main` en paralelo a `ci.yml`. Estructura
actual: `docker-build` (3 imágenes) → `deploy-staging` (Cloud Run + smoke) /
`deploy-production` (promoción digest) / `trigger-coolify` (un webhook único sin
auth). Brechas: no depende de CI (AC2), build de validación de Astro exige API
viva (AC4), webhook único por POST sin Bearer ni aislamiento de ambientes
(AC6/AC7), y el orden Cloud Run→Astro no está garantizado (AC3).

## Decisión de diseño

### 1. Gating por `workflow_run` (AC2)

Reemplazar el trigger por:

```yaml
on:
  workflow_run:
    workflows: ['CI']
    types: [completed]
  workflow_dispatch:
```

El job verifica:

```yaml
jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
```

La unión `workflow_dispatch` + el check de `conclusion` cubren AC2 (CI debe haber
pasado para el mismo commit). El SHA se toma de `github.event.workflow_run.head_sha`
en lugar de `github.sha`.

### 2. Build de validación Astro sin API (AC4)

```yaml
- name: Build web image
  run: docker build --build-arg REQUIRE_API=false -f apps/web/Dockerfile -t riff-web:pr .
```

`REQUIRE_API=true` queda exclusivamente en las Build Variables de Coolify (produce
el fail-fast real en deploy). Deploy-runner y builds reales ya no divergen en el
mismo job.

### 3. Webhooks por ambiente, Bearer (AC6/AC7)

Eliminar `COOLIFY_WEBHOOK_URL`; crear dos jobs con patrón idéntico:

```yaml
- name: Trigger web staging
  env:
    TOKEN: ${{ secrets.COOLIFY_API_TOKEN }}
    URL:   ${{ secrets.COOLIFY_WEB_STAGING_WEBHOOK_URL }}
  run: |
    if [ -z "$URL" ] || [ -z "$TOKEN" ]; then
      echo "❌ COOLIFY web staging secret not set — skipping (no-op)."
      exit 0
    fi
    curl --fail --silent --show-error --request GET "$URL" \
      -H "Authorization: Bearer $TOKEN"
```

Aislamiento: `deploy-frontends-staging` usa solo webhooks de staging;
`deploy-frontends-production` solo los de producción. En staging,
`deploy-frontends-staging` lleva `needs: deploy-backend-staging` (AC3).

Los 5 secrets son ops manual (no se crean en este change; el no-op mantiene main
verde hasta que existan, mismo patrón que `vars.GCP_PROJECT`).

## Archivos afectados

- `.github/workflows/deploy.yml` (Task 1-3)
- `docs/deploy-standards.md` (Task 4)

## Testing / validación

- No hay capa de aplicación: la verificación es **estática** sobre el workflow:
  - `npx actionlint .github/workflows/deploy.yml` (o parseo YAML) sin errores.
  - Revisión manual del diff: `workflow_run` present, `conclusion == 'success'`,
    `--build-arg REQUIRE_API=false` en el build de validación, 4 webhooks con
    Bearer y aislamiento staging/prod, ningún log de secretos.
  - `bash check-refs.sh` y `bash specboot.sh --ci` en verde.

## Fuera de alcance

- Creación de secrets (ops), provisioning GCP (ops), recursos Coolify (ops).
- Smoke tests de frontends y rollback extendido (Change C).
- Webhook de regeneración de catálogo en backend (Change B).