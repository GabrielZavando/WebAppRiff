---
description: Adversarial red-team code audit — security, robustness, SOLID, tradeoffs. Emits SHIP/NO-SHIP verdict and persists it to openspec/state/adversarial-result.json. Read-only over code.
mode: subagent
permission:
  edit: deny
  bash:
    "npm audit *": allow
    "npx eslint *": allow
    "npx dependency-cruiser *": allow
    "git diff": allow
    "git diff *": allow
    "git status": allow
    "ls *": allow
    "cat *": allow
    "mkdir -p openspec/*": allow
    "*": deny
---

{file:ai-specs/skills/code-auditing/SKILL.md}
