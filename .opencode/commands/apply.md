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

## TDD Failure Protocol

When a test fails during task implementation, the agent follows this mandatory protocol. It **extends** the existing RED-GREEN-REFACTOR cycle defined in `ai-specs/agents/build-agent.md` — it does not replace it.

### Limit: 3 consecutive attempts

1. **Detect** — A failing test stops the GREEN step. Analyze the error before touching code again.
2. **Attempt** — Fix the minimum code needed and re-run the failing test. Each failed re-run counts as one attempt. Maximum **3 consecutive attempts** per task.
3. **Report** — If the 3rd consecutive attempt fails, generate a `TDD Failure Report` containing the fields: `Task`, `Attempt`, `Error`, `Suggested investigation`.
4. **Stop** — After reporting, stop immediately: do **not** mark the task as complete, do **not** continue with the next task, and wait for explicit user instruction.

An explicit user instruction to retry resets the attempt counter, and the protocol applies again from step 1.

### TDD Failure Report template

Emit the report verbatim using this template:

```
TDD Failure Report
Task: <task id and short description from tasks.md>
Attempt: <1 | 2 | 3>
Error: <condensed error summary — no full traceback>
Suggested investigation: <one concrete next step to diagnose the failure>
```
