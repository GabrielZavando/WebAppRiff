---
description: Adversarial red-team code audit — security, robustness, SOLID, tradeoffs. Emits SHIP/NO-SHIP verdict and persists it to openspec/state/adversarial-result.json. Read-only over code.
mode: subagent
permission:
  task: deny
  edit:
    "*": deny
    "openspec/state/adversarial-result.json": allow
  bash:
    "*": deny
    "npm audit *": allow
    "npx eslint *": allow
    "npx dependency-cruiser *": allow
    "git diff": allow
    "git diff *": allow
    "git status": allow
    "git status *": allow
    "ls *": allow
    "mkdir -p openspec/state": allow
    "date -u *": allow
---

{file:ai-specs/skills/code-auditing/SKILL.md}
