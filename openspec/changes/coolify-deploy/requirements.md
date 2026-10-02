# Requirements: coolify-deploy

1. **REQ-001 — Deploy nativo vía GitHub App de Coolify**: El deploy de los
   frontends de staging (`riff-web-staging`, `riff-admin-staging`) se maneja
   nativamente por Coolify (GitHub App `coolify-github-zavando`) al hacer merge
   de un PR a `main`, sin workflow de GitHub Actions. Traceable: SC-001,
   SC-004.
2. **REQ-002 — Sin workflow de deploy personalizado**: `.github/workflows/deploy.yml`
   debe ser eliminado; el único workflow del repositorio es `ci.yml` (protege
   PRs; no dispara deploys). Traceable: SC-002, SC-004.
3. **REQ-003 — Sin tests del workflow eliminado**: los tests asociados al
   workflow (`tests/deploy-workflow.spec.mjs`,
   `tests/deploy-standards-docs.spec.mjs`) deben eliminarse del repositorio.
   Traceable: SC-002.
4. **REQ-004 — Redeploy manual**: el redeploy manual de una app staging se
   realiza desde el panel de Coolify (o empujando un commit a `main`), sin
   GitHub Actions. Traceable: SC-003.
5. **REQ-005 — Documentación del flujo nativo**: `docs/deploy-standards.md`
   debe describir el deploy nativo vía la GitHub App de Coolify en §Pipeline,
   §Deploy Flow (Lane frontends) y §Environment Variables, sin referencias a
   curl, webhooks de `/api/v1/deploy` ni un workflow de Actions. Traceable:
   SC-005.