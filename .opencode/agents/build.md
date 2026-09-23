---
description: Implementation agent — writes code following TDD
mode: primary
permission:
  task:
    "*": deny
    backend: allow
    frontend: allow
  edit:
    "*": allow
    "openspec/state/verify-results.json": deny
    "openspec/state/adversarial-result.json": deny
  bash:
    "*": allow
    "git add": deny
    "git add *": deny
    "git commit": deny
    "git commit *": deny
    "git push": deny
    "git push *": deny
    "git push --force*": deny
    "git push --force-with-lease*": deny
    "git push -f*": deny
    "git push *-f*": deny
    "gh pr create *": deny
    "gh pr edit *": deny
    "gh pr view *": deny
    "gh pr *": deny
    "*; git add*": deny
    "* && git add*": deny
    "*; git commit*": deny
    "* && git commit*": deny
    "*; git push*": deny
    "* && git push*": deny
    "*; git push --force*": deny
    "* && git push --force*": deny
    # Compound separators without surrounding spaces (validator coverage is
    # EXACT: `;`, `&&`, `||`, `|`, newline — each ± space; pattern-based denies
    # are defense-in-depth, not a security boundary when arbitrary code runs).
    "*;*git add*": deny
    "*&&*git add*": deny
    "*||*git add*": deny
    "*|*git add*": deny
    "*\n*git add*": deny
    "*;*git commit*": deny
    "*&&*git commit*": deny
    "*||*git commit*": deny
    "*|*git commit*": deny
    "*\n*git commit*": deny
    "*;*git push*": deny
    "*&&*git push*": deny
    "*||*git push*": deny
    "*|*git push*": deny
    "*\n*git push*": deny
---

{file:ai-specs/agents/build-agent.md}
