# Scenarios: coolify-deploy

> **Fuente**: ticket `cicd-coolify-deploy` + evolución post-apply (2026-10-02):
> el approach cambió de GitHub Actions + webhooks (`/api/v1/deploy` con curl —
> devolvía 404) a **deploy nativo vía la GitHub App de Coolify**
> (`coolify-github-zavando`), que ya tiene acceso al repositorio.

### SC-001: Merge a main dispara el deploy nativo de Coolify

**Given** la GitHub App de Coolify (`coolify-github-zavando`) tiene acceso al repositorio
**When** se hace merge de un PR a `main`
**Then** Coolify recibe el push nativamente y despliega ambas aplicaciones staging (`riff-web-staging`, `riff-admin-staging`), build in-situ por app, sin necesidad de un workflow de GitHub Actions

### SC-002: No existe workflow de deploy personalizado

**Given** el repositorio en su estado final
**When** se revisa `.github/workflows/`
**Then** NO existe `deploy.yml` (ni ningún otro workflow de deploy); el único workflow es `ci.yml` que protege PRs
**And** no existen tests referenciando un workflow de deploy eliminado

### SC-003: Redeploy manual vía panel de Coolify

**Given** un operador quiere redesplegar una app staging
**When** ejecuta redeploy desde el panel de Coolify (o empuja un commit a `main`)
**Then** Coolify despliega la app sin intervención de GitHub Actions

### SC-004: Los PRs no disparan deploys

**Given** un desarrollador abre un PR hacia `main`
**When** el PR completa
**Then** no se dispara ningún deploy (solo `ci.yml` corre como check de CI)

### SC-005: La documentación refleja el flujo nativo

**Given** `docs/deploy-standards.md`
**When** se revisa la sección de pipeline/deploy
**Then** describe el deploy nativo vía la GitHub App de Coolify, sin referencias a curl, webhooks de `/api/v1/deploy` ni un workflow de Actions