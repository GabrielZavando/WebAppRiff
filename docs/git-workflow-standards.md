# Git Workflow Standards — Riff Catálogo Digital

> Fuente única de verdad de la convención git del proyecto (ramas, commits, PRs, deploy).
> Referenciado por el skill `plan-change` (§1), el agente `plan-agent`, el comando `/apply`
> y `docs/framework-contract.md`. Creado el 2026-10-02 (change `add-git-workflow-standards`,
> ticket `DOCS-001`).

## 1. Flujo estándar de ramas

Flujo estándar: **`feature/` → PR → merge a `main`**.

1. La rama del ticket se crea **desde `main` actualizado** y **nunca sobre un
   árbol git sucio** (sin cambios sin commitear ni staged), mediante
   `/plan-change` (Step 1½ del skill): `git checkout -b feature/{name}`.
2. El trabajo se implementa en la rama del ticket. **Nunca se implementa
   directamente sobre `main`.**
3. Se abre un PR hacia `main` (ver §4) y se mergea con merge commit.
4. **Acumulación de historia**: si el trabajo se extiende en el tiempo, la rama
   se actualiza con `main` (merge de `main` en la rama del ticket) para
   mantener el PR mergeable y el historial lineal por change.

Ejemplo real del repo: `feature/cicd-coolify-deploy` → PR #31 → `main`.

## 2. Convención de naming de ramas

Patrón: **`{type}/{short-name-kebab-case}`** — **sin ticket ID** en el nombre
de rama.

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feature/` | Nueva funcionalidad o mejora | `feature/add-git-workflow-standards` |
| `fix/` | Corrección de bug | `fix/{short-name}` |
| `chore/` | Mantenimiento, tooling, dependencias | `chore/specboot-0.11.0` |
| `docs/` | Cambios documentales | `docs/{short-name}` |
| `test/` | Cambios de tests | `test/{short-name}` |
| `refactor/` | Refactorización sin cambio de comportamiento | `refactor/{short-name}` |

Reglas:

- kebab-case, corto y descriptivo (2-5 palabras).
- El ticket ID **no** forma parte del nombre de rama: viaja en el PR y en los
  artefactos OpenSpec (`openspec/tickets/`, `openspec/changes/`).
- Este documento es la **fuente de verdad** de la convención; el ejemplo del
  skill `plan-change` (`feature/{ticket-id}-{short-name}`) queda subordinado a
  esta sección.
- Ramas reales del repo que cumplen el patrón: `feature/cicd-coolify-deploy`,
  `feature/logo-size-cap-logo-shrink`, `feature/web-home-contact-tweaks`,
  `chore/specboot-0.11.0`.

## 3. Proceso de commit

- **Conventional Commits en inglés**: `feat:`, `fix:`, `docs:`, `refactor:`,
  `test:`, `chore:` (con scope opcional, p. ej. `docs(deploy):`, `feat(web):`).
- **Un commit = un cambio lógico**: agrupar por paths afines (p. ej. código,
  specs y docs en commits separados).
- **Gates duros previos al commit (M-901)**: `/verify` con `status: PASS` y
  `/adversarial-review` con `verdict: SHIP` vigentes para el change activo.
  Sin ambas evidencias (`openspec/state/`) el commit bloquea; el escape hatch
  `--force` queda registrado con el trailer `Gate-Bypass` en el mensaje del
  commit.
- **Ownership**: `git add`, `git commit` y `git push` son exclusivos de
  `/commit` — los agentes plan/apply tienen `git commit` y `git push`
  prohibidos.
- Formato completo: `ai-specs/reference/commits.md` · Flujo completo:
  `ai-specs/skills/commit/SKILL.md`.

## 4. Proceso de PR

1. **Pre-check contra `main`**: `git fetch origin main` y
   `git merge-base --is-ancestor origin/main HEAD`. Si falla → la rama está
   desactualizada: actualizarla antes (merge de `main` en la rama, §1).
2. **Título conventional** (mismo formato que los commits, §3).
3. **Cuerpo del PR**: qué cambia, por qué, cómo probar + referencia al change
   OpenSpec (`openspec/changes/{name}/`). Usar
   `.github/pull_request_template.md` si existe. `gh pr create` solo tras
   aprobación explícita del usuario.
4. **Merge a `main`** con merge commit. **El push directo a `main` sin PR está
   prohibido** — el merge dispara el deploy de Coolify (§5).
5. **Post-merge**: actualizar `main` local (`git checkout main && git pull`).

## 5. Integración con Coolify (deploy automático al merge a main)

> Fuente de verdad del deploy: `docs/deploy-standards.md` §"Deploy de frontends —
> nativo vía GitHub App de Coolify" (change `coolify-deploy`, 2026-10-02).

- **Trigger**: merge de un PR a `main` → la GitHub App de Coolify
  (`coolify-github-zavando`) recibe el push **nativamente** y despliega las
  apps de staging (`riff-web-staging`, `riff-admin-staging`), build in-situ
  por app (`web`, `admin`).
- **Sin workflow de deploy**: `.github/workflows/` solo contiene `ci.yml`
  (validación estructural specboot + `make ci`), que protege PRs y **no
  dispara deploys**.
- **Redeploy manual**: desde el panel de Coolify (o empujando un commit a
  `main`).
- **Lane backend (Cloud Run)**: pendiente de implementar como workflow propio —
  el deploy del backend **no** se gestiona en este flujo (ver
  `docs/deploy-standards.md` §"Deploy de frontends" → Lane backend).
- Rollback: redeploy manual en el panel de Coolify (frontends — ver
  `docs/deploy-standards.md` §"Rollback").
