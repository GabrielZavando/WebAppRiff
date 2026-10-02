# Requirements: add-git-workflow-standards

1. **REQ-001 — Flujo estándar de ramas**: `docs/git-workflow-standards.md`
   documenta el flujo `feature/{name}` desde `main` → PR → merge a `main`, con
   acumulación de historia de `main` en la rama del ticket (creada por
   `/plan-change` Step 1½ sobre árbol git limpio). Traceable: SC-001, SC-008.
2. **REQ-002 — Convención de naming de ramas**: el documento define el patrón
   `{type}/{short-name-kebab-case}` **sin ticket ID** y los tipos permitidos
   (`feature/`, `fix/`, `chore/`, `docs/`, `test/`, `refactor/`). El doc es la
   fuente de verdad que el skill `plan-change` ya delega en §1; el ejemplo del
   skill (`feature/{ticket-id}-{short-name}`) queda subordinado al doc.
   Traceable: SC-002, SC-008.
3. **REQ-003 — Proceso de commit**: el documento norma Conventional Commits en
   inglés (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`), 1 commit =
   1 cambio lógico, y los gates duros (verify `PASS` + adversarial `SHIP`)
   previos al commit; el ownership de `git commit`/`git push` es exclusivo de
   `/commit`. Traceable: SC-003.
4. **REQ-004 — Proceso de PR**: el documento norma el pre-check
   `git merge-base --is-ancestor origin/main HEAD` (avisar si la rama está
   desactualizada), el título conventional con referencia al change y el merge
   a `main` — el push directo a `main` sin PR está prohibido (el merge dispara
   el deploy). Traceable: SC-004.
5. **REQ-005 — Integración Coolify**: el documento describe el deploy
   automático nativo al merge a `main` vía la GitHub App
   `coolify-github-zavando` (staging `riff-web-staging`/`riff-admin-staging`,
   build in-situ `web`/`admin`), el redeploy manual (panel de Coolify o push a
   `main`) y deja explícito que la lane backend (Cloud Run) está pendiente de
   workflow propio. Consistente con `docs/deploy-standards.md`, sin referencias
   a webhooks obsoletos. Traceable: SC-005, SC-008.
6. **REQ-006 — Referencias resueltas**: las 4 referencias existentes al archivo
   (`ai-specs/skills/plan-change/SKILL.md`, `ai-specs/agents/plan-agent.md`,
   `.opencode/commands/apply.md`, `docs/framework-contract.md`) apuntan a un
   archivo existente. Traceable: SC-006.
7. **REQ-007 — Integridad del puente**: tras crear el archivo,
   `bash check-refs.sh` y `bash specboot.sh --ci` reportan 0 errores.
   Traceable: SC-007.
