# Proposal: add-git-workflow-standards

> **Origin ticket**: `DOCS-001` (rama `feature/add-git-workflow-standards`)
> **Title**: Add git workflow standards
> **Tag**: [docs]

## Why

Cuatro referencias del repositorio apuntan a `docs/git-workflow-standards.md`,
que no existe: `ai-specs/skills/plan-change/SKILL.md` (líneas 37 y 49 —
convención de rama §1 y acumulación de historia), `ai-specs/agents/plan-agent.md`
(línea 15), `.opencode/commands/apply.md` (línea 24) y `docs/framework-contract.md`
(línea 265). La convención git real del proyecto —ramas `{type}/{kebab-case}`
sin ticket ID, PR con merge commit, deploy nativo vía Coolify al merge a
`main`— queda implícita en la práctica en vez de normativa, y el skill
`plan-change` delega en un documento inexistente. Objetivo: crear el estándar
como fuente única de la convención git del proyecto (ramas, commits, PRs,
deploy), reflejando el flujo real incluido el deploy nativo.

## What Changes

- **Crear** `docs/git-workflow-standards.md` (del proyecto) con 5 secciones:
  §1 flujo estándar de ramas (`feature/{name}` desde `main` → PR → merge a
  `main`, acumulación de historia), §2 convención de naming
  (`{type}/{short-name-kebab-case}` sin ticket ID; tipos `feature/`, `fix/`,
  `chore/`, `docs/`, `test/`, `refactor/`), §3 proceso de commit (Conventional
  Commits en inglés, gates verify `PASS` + adversarial `SHIP`), §4 proceso de
  PR (pre-check contra `origin/main`, título conventional, merge a `main`),
  §5 integración Coolify (deploy nativo vía GitHub App `coolify-github-zavando`
  al merge a `main`, staging, redeploy manual).
- Fuera de alcance: actualizar `docs/docs-standard.md` (framework, intocable),
  mutar las referencias de los skills, lane backend Cloud Run (se documenta
  como pendiente de workflow propio), crear `docs/consumer-git-workflow.md`.

## Design Validation

- **Entidades data-model**: no aplican (change documental, sin entidades de BD).
- **Endpoints api-spec.yml**: no aplican (change documental).
- **Conflicto menor**: el ejemplo de rama del skill `plan-change`
  (`feature/{ticket-id-lowercase}-{short-name}`, p. ej. `feature/proj-123-auth-reset`)
  discrepa de la convención real verificada en el repo
  (`feature/cicd-coolify-deploy`, `chore/specboot-0.11.0` — sin ticket ID). El
  documento normado es la fuente de verdad que el skill ya delega en §1
  (`convention: docs/git-workflow-standards.md §1`), por lo que el ejemplo del
  skill queda subordinado al doc — el conflicto se resuelve al crear el
  documento, sin mutar los skills.
- **Consistencia Coolify**: §5 debe alinearse con `docs/deploy-standards.md`
  §"Deploy de frontends — nativo vía GitHub App de Coolify" (actualizado
  2026-10-02, change `coolify-deploy`): deploy nativo, sin workflow de deploy
  en `.github/workflows/` (solo `ci.yml`), webhooks obsoletos excluidos.
