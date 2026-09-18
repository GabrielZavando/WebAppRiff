# Change Proposal: remove-release-workflow

- **Ticket ID**: C4
- **Ticket title**: [ci] Eliminar workflow Release (Publish to GitHub Packages) del proyecto consumidor
- **Tag**: [ci]
- **Enriched artifact**: no aplica (ticket bien formado, alcance trivial)

## Summary

Eliminar `.github/workflows/release.yml`. Su job `Publish to GitHub Packages` intenta publicar el paquete raíz `riff-catalogo-digital` (v0.1.0, `"private": true`) en cada push a `main`; npm rechaza publicar paquetes privados, por lo que el job solo genera runs con ruido/fallo en cada merge. Además, el job `validate` duplica la validación que `ci.yml` ya ejecuta en main (check-refs, specboot ci, make ci).

## Motivation

Este repositorio es un **consumidor** del framework (`@gabrielzavando/specboot` como devDependency), no su publicador. El workflow es un residuo del template que no aporta valor: ensucia el historial de Actions con runs fallidos/innecesarios y confunde al equipo (se confunde con el deploy real de la app, que vive en `deploy.yml` por tags `v*` y en el rebuild de Coolify por merge).

## Scope

In scope:
- Eliminar `.github/workflows/release.yml`.
- Verificar que `ci.yml` (push a main + PR) sigue siendo el gate de validación y que `deploy.yml` (tags `v*` / manual) queda intacto.

Out of scope:
- Cambios en `deploy.yml`, Coolify, o el proceso de release por tags.
- Cualquier modificación al framework Specboot (pertenece a su propio repo).
