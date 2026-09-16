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

## Pre-flight Preconditions (mandatory)

Before dispatching any task, verify both conditions and **abort** if either fails:

1. **Active branch matches the project convention** (e.g. `feature/*` — see
   `docs/git-workflow-standards.md`). Run `git branch --show-current`. If the
   branch does not match, abort with an explicit message listing the current
   branch and suggesting `/plan-change` as the step that creates the ticket
   branch.
2. **Clean git state**: no uncommitted or staged changes (`git status --porcelain`
   empty). If dirty, abort listing the dirty files and ask the user to commit
   or stash them first.

Never implement a task on the main branch or over a dirty tree — that is how
untraceable changes slip outside the SDD cycle.

## TDD Failure Protocol

When a test fails during task implementation, follow the **TDD Failure
Protocol** — canonical source: `docs/tdd-failure-protocol.md` (3 consecutive
attempts max, `TDD Failure Report` on the 3rd failure, then full stop; user
retry resets the counter). It **extends** the RED-GREEN-REFACTOR cycle defined
in `ai-specs/agents/build-agent.md` — it does not replace it.
