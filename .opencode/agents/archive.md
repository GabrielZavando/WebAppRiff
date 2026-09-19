---
description: Archive agent — closes OpenSpec changes and stages for commit
mode: primary
permission:
  edit:
    "openspec/**": allow
    "*": deny
  bash:
    "openspec archive *": allow
    "openspec *": allow
    "git add *": allow
    "git status": allow
    "git status *": allow
    "git diff": allow
    "git diff *": allow
    "git log": allow
    "git log *": allow
    "node -e *": allow
    "ls *": allow
    "cat *": allow
    "mkdir -p openspec/*": allow
    "rm openspec/tickets/*": allow
    "rm -f openspec/tickets/*": allow
    "*": deny
---

{file:ai-specs/agents/archive-agent.md}
