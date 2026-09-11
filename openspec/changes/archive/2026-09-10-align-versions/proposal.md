# Proposal — align-versions

**Ticket ID**: V1
**Original title**: Alinear versiones del monorepo
**Tag (source)**: fullstack (inferred from Capas afectadas)
**Derived change name**: align-versions
**Change folder**: openspec/changes/align-versions/
**Enriched artifact used**: yes (openspec/tickets/V1-enriched.md)

## Naming rationale

- Verb: align
- Noun: versions
- Domain prefix: none (tooling/infra concern, cross-workspace)

## Context loaded

- `docs/backend-standards.md` — NestJS stack, testing, design principles
- `docs/frontend-standards.md` — Angular/Astro stack, testing, design tokens
- `docs/data-model/data-model.md` — domain entities (no impact in this change)
- `docs/openspec-tasks-mandatory-steps.md` — mandatory implementation checklist

## Summary

The Riff monorepo has accumulated version drift across its 4 workspaces (backend, web, admin, html-sanitize) as documented in AUDIT.md H6. This change aligns all tooling and framework versions to their latest stable/LTS releases as of September 2026:

- **Node.js 22 → 24 LTS** (Krypton) — runtime unificado
- **Angular 18 → 22** (Active LTS until 2028-06)
- **NestJS 10 → 11** (stable; v12 too fresh)
- **TypeScript ~5.3/^5.9 → ~6.0.0** (uniform)
- **ESLint 8 → 9** with flat config migration
- **vitest ^1/^3/^4 → ^4.1.10** (uniform)
- **Playwright ^1.40/^1.62 → ^1.52.0** (uniform)
- **@types/node ^20/^22 → ^24.0.0** (matching Node 24)

Additionally: remove redundant `@ngrx/store` (A1), create missing configs (`vitest.config.ts`, `playwright.config.ts` for admin), add `.nvmrc`, update Dockerfiles, and sync documentation.

## Motivation

Version drift causes: non-reproducible builds, type mismatches between Node runtime and `@types/node`, inconsistent test runner behavior across workspaces, ESLint 8 receiving no security patches (EOL), and developer confusion when docs don't match code. Aligning eliminates this class of issues and positions the project on supported, maintained versions.
