---
description: Implement tasks from OpenSpec artifacts (TDD)
agent: build
---

The active OpenSpec change is in openspec/. Read the current tasks.md and determine the domain:

1. If the task involves backend (NestJS, API, database, migrations) → delegate to the `backend` subagent (`{file:.opencode/agents/backend.md}`)
2. If the task involves frontend (Angular, Astro, UI components) → delegate to the `frontend` subagent (`{file:.opencode/agents/frontend.md}`)
3. If the task involves both → continue as the `build` agent (full-stack), reading both standards

Each subagent loads its own standards and role through its file reference, so do not re-read
backend-developer.md / frontend-developer.md manually — dispatch and let it work the
first pending task following TDD as defined in its documentation.

## Pre-flight Preconditions (mandatory, run once per change)

Run the pre-flight **once per change**, NOT before every task. It runs on the
first `/apply` invocation for the active change; on a resumed invocation it only
re-verifies the branch and that no *foreign* (unrelated to the change) changes
exist.

1. **Active branch matches the project convention** (e.g. `feature/*` — see
   `docs/git-workflow-standards.md`). Run `git branch --show-current`. If the
   branch does not match, abort listing the current branch and suggesting
   `/plan-change` as the step that creates the ticket branch.
2. **First-run git state**: dirt limited to `openspec/changes/{active-change}/**`
   (the artifacts created by `/plan-change`) is ALLOWED — no commit or stash
   needed. Any change outside `openspec/changes/{active-change}/**` blocks the
   entry; list those files and ask the user to commit or stash them first.
3. **Resuming**: once implementation has started (a prior `/apply` left
   uncommitted changes produced by the change's completed tasks), `/apply`
   accepts those changes, MUST NOT require intermediate commits, and MUST resume
   from the first pending task (`- [ ]` in `tasks.md`). Foreign changes still
   block.

Persist a per-change marker (e.g. `openspec/state/apply-preflight-{change}.json`)
on the first successful pre-flight so a resumed `/apply` skips the strict
first-run check. NEVER write to `openspec/state/{verify,adversarial}-result.json`
(they remain fail-closed for `build`).

Never implement a task on the main branch. `/commit` retains exclusive ownership
of `git add`, `git commit` and `git push`.

> Interplay with the `## Mandatory Steps` checklist: its "Estado git limpio" item
> is interpreted at change level — the first `/apply` run tolerates the plan
> artifacts allowed above and resumed runs accept the change's own produced
> changes.

## TDD Failure Protocol

When a test fails during task implementation, follow the **TDD Failure
Protocol** — canonical source: `docs/tdd-failure-protocol.md` (3 consecutive
attempts max, `TDD Failure Report` on the 3rd failure, then full stop; user
retry resets the counter). It **extends** the RED-GREEN-REFACTOR cycle defined
in `ai-specs/agents/build-agent.md` — it does not replace it.
