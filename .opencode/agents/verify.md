---
description: Verification agent — runs tests, checks traceability, persists verify evidence (read-only over code)
mode: primary
permission:
  edit: deny
  bash:
    "openspec *": allow
    "git diff": allow
    "git diff *": allow
    "git status": allow
    "git log": allow
    "git log *": allow
    "git merge-base *": allow
    "npm test *": allow
    "npm run test *": allow
    "npx vitest *": allow
    "npx jest *": allow
    "pytest *": allow
    "rg *": allow
    "ls *": allow
    "cat *": allow
    "mkdir -p openspec/*": allow
    "*": deny
---

{file:ai-specs/agents/verify-agent.md}
