# Changelog — Riff Catálogo Digital Headless

Cambios notables del proyecto, en formato
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
El historial completo de cambios vive en los changes archivados de OpenSpec
(`openspec/changes/archive/`) y en el historial git.

## [Unreleased]

### Changed

- **Framework SDD: Specboot → OpenSpec (Fission-AI v1.14.0)**: se eliminó el
  template `@gabrielzavando/specboot` (scripts `specboot.sh`, `check-refs.sh`,
  `validate-specboot.sh`, `release-bump.sh`, `ai-specs/`, `templates/`,
  `.opencode/agents/`, `.opencode/commands/`, `.specboot.json` y docs del
  framework) y se adoptó la CLI `@fission-ai/openspec@1.14.0` como
  devDependency. El flujo SDD usa ahora las skills de OpenSpec
  (`/opsx-propose`, `/opsx-apply`, `/opsx-archive`, `/opsx-explore`,
  `/opsx-sync`).
- **CI**: `.github/workflows/ci.yml` ahora corre `make ci`
  (`openspec validate --all --strict` + lint + typecheck + test + audit);
  se eliminó la auth de GitHub Packages (Specboot era la única dep privada).
- **Makefile**: reescrito como proyecto propio (targets npm workspaces +
  `openspec-validate`); eliminados `refs`, `validate-specboot`, `solid-lint`.
- **docs**: eliminados `framework-contract.md`, `docs-standard.md`,
  `specboot-json-standard.md`, `openspec-tasks-mandatory-steps.md`,
  `versioning-standard.md`, `tdd-failure-protocol.md`, `ci-standards.md`
  (maquinaria de Specboot); `README.md` reescrito para el proyecto.
- **Estado Specboot eliminado**: `openspec/state/`, `openspec/tickets/` y los
  specs `openspec/specs/specboot-*` (git rm; recuperables desde el historial).

### Notes

- **Deuda técnica conocida — supresiones de audit**: el gate de audit
  (`scripts/audit.mjs`) es ahora bloqueante y expone 44 vulnerabilidades
  `high` pre-existentes (jest/firebase y transitivas de Angular) que
  estaban silenciadas por el antiguo `npm audit || true`. Están
  registradas como 95 supresiones activas en
  `npm-audit-suppressions.json` con razón provisional "remediate via
  V1/Q2 upgrade". El script actual solo soporta revocación manual vía
  `revokedAt`, sin caducidad automática. Endurecimiento planificado como
  **Q6** en `AUDIT.md` (añadir campo `review_by` y expiración en el
  gate). Mientras Q6 no esté implementado, la revisión de estas
  supresiones es responsabilidad manual del equipo.
  