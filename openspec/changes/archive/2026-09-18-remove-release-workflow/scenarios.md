# Scenarios: remove-release-workflow

### SC-001: Push a main sin workflow de publicación
- Given `release.yml` eliminado del repositorio
- When se hace merge/push a `main`
- Then no se dispara ningún run "Publish to GitHub Packages" en GitHub Actions

### SC-002: Validación de main preservada
- Given `ci.yml` intacto
- When se hace push a `main` (o se abre un PR)
- Then CI ejecuta la validación completa (lint, tests, check-refs, specboot --ci, make ci) y falla ante errores

### SC-003: Deploy por tags intacto
- Given `deploy.yml` intacto
- When se pushea un tag `v*` (o se ejecuta manualmente)
- Then el deploy staging/production se comporta igual que antes

### Edge Cases

| Case | Expected Behavior |
|---|---|
| Run histórico de Release en Actions | Permanece como histórico; no se re-ejecuta |
| specboot.sh --ci / check-refs.sh | Siguen pasando: `.github/workflows/` sigue existiendo (ci.yml, deploy.yml); no hay referencias vivas a release.yml |
