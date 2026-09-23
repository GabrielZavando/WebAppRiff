---
description: Planning agent — generates and updates OpenSpec artifacts only
mode: primary
permission:
  task: deny
  edit:
    "*": deny
    "openspec/**": allow
  bash:
    "*": deny
    "openspec *": allow
    "git checkout *": allow
    "git checkout": allow
    "git switch *": allow
    "git switch": allow
    "git branch *": allow
    "git branch": allow
    "git status": allow
    "git status *": allow
    "git log *": allow
    "git merge-base *": allow
    "git commit": deny
    "git push": deny
---

{file:ai-specs/agents/plan-agent.md}
