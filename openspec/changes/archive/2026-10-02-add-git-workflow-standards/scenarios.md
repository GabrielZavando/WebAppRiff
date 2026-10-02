# Scenarios: add-git-workflow-standards

> **Fuente**: ticket enriquecido `DOCS-001` (`openspec/tickets/DOCS-001-enriched.md`).
> Mapeo 1:1 de sus criterios de aceptación, preservando los IDs `SC-{NNN}`.

### SC-001: El archivo existe y norma el flujo feature → PR → merge a main

**Given** que se crea `docs/git-workflow-standards.md`
**When** un desarrollador consulta la convención de ramas
**Then** encuentra el flujo estándar `feature/` → PR → merge a `main` documentado en §1

### SC-002: Convención de naming de ramas normada

**Given** el documento `docs/git-workflow-standards.md`
**When** se revisa la sección de naming
**Then** define el patrón `{type}/{short-name-kebab-case}` sin ticket ID y lista los tipos permitidos (`feature/`, `fix/`, `chore/`, `docs/`, …)

### SC-003: Proceso de commit documentado

**Given** el documento `docs/git-workflow-standards.md`
**When** se consulta cómo commitear
**Then** documenta Conventional Commits en inglés, 1 commit = 1 cambio lógico y los gates duros (verify `PASS` + adversarial `SHIP`) previos al commit

### SC-004: Proceso de PR documentado

**Given** el documento `docs/git-workflow-standards.md`
**When** se consulta cómo abrir/mergear un PR
**Then** documenta el pre-check contra `origin/main`, el título conventional con referencia al change y el merge a `main` (sin push directo)

### SC-005: Integración con Coolify documentada

**Given** el documento `docs/git-workflow-standards.md`
**When** se consulta el deploy de frontends
**Then** documenta el deploy automático nativo al merge a `main` vía GitHub App `coolify-github-zavando` (build in-situ staging, redeploy manual) y deja explícito que la lane backend Cloud Run está pendiente de workflow propio

### SC-006: Las referencias existentes resuelven

**Given** que el archivo `docs/git-workflow-standards.md` se crea
**When** plan-change/plan-agent/apply/framework-contract lo referencian
**Then** la referencia apunta a un archivo existente (prosa, sin `{file:...}` roto)

### SC-007: Herramientas de integridad en verde

**Given** el archivo `docs/git-workflow-standards.md` creado
**When** se ejecuta `bash check-refs.sh` y `bash specboot.sh --ci`
**Then** ambas reportan 0 errores

### SC-008: La documentación refleja el flujo real

**Given** el documento `docs/git-workflow-standards.md`
**When** se contrasta con la realidad del repo
**Then** las ramas reales (`feature/cicd-coolify-deploy`, `chore/specboot-0.11.0`…) cumplen el patrón documentado y el deploy documentado coincide con deploy-standards.md (nativo Coolify, sin webhooks)
