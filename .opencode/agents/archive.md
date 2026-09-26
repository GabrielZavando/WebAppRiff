---
description: Archive agent — closes OpenSpec changes and stages for commit
mode: primary
permission:
  task: deny
  edit:
    "*": deny
    "openspec/**": allow
  bash:
    "*": deny
    "openspec archive *": allow
    "git status": allow
    "git status *": allow
    "git diff": allow
    "git diff *": allow
    "git log": allow
    "git log *": allow
    "node scripts/read-json-field.mjs *": allow
    "ls *": allow
    "cat *": allow
    "mkdir -p openspec/state": allow
    "rm openspec/tickets/*": allow
    "rm -f openspec/tickets/*": allow
    "date -u *": allow
---

{file:ai-specs/agents/archive-agent.md}