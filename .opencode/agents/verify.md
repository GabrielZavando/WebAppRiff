---
description: Verification agent — runs tests, checks traceability, persists verify evidence (read-only over code)
mode: primary
permission:
  task: deny
  edit:
    "*": deny
    "openspec/state/verify-results.json": allow
  bash:
    "*": deny
    "openspec validate *": allow
    "git diff": allow
    "git diff *": allow
    "git status": allow
    "git status *": allow
    "git log": allow
    "git log *": allow
    "git merge-base *": allow
    "npm test": allow
    "npm test *": allow
    "npm run test *": allow
    "npx vitest *": allow
    "npx jest *": allow
    "pytest *": allow
    "bash tests/*": allow
    "bash scripts/*": allow
    "date *": allow
    "rg *": allow
    "ls *": allow
    "mkdir -p openspec/state": allow
---

{file:ai-specs/agents/verify-agent.md}