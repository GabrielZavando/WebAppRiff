# Makefile — Riff Catálogo Digital
#
# Monorepo Node (npm workspaces): apps/* + packages/*.
# Todos los targets delegan en scripts npm de la raíz (package.json),
# salvo `openspec-validate` que ejecuta la CLI de OpenSpec (Fission-AI).

.PHONY: help install lint typecheck test build audit smoke test-ci openspec-validate commitlint ci

help:
	@echo ""
	@echo "Targets del proyecto:"
	@echo "  install            Instalar dependencias (npm ci)"
	@echo "  lint               Lint por workspace (npm run lint --workspaces)"
	@echo "  typecheck          Typecheck por workspace"
	@echo "  test               Tests por workspace (npm run test --workspaces)"
	@echo "  test-ci            Gate de tests explícito (backend con cobertura 90% + web/admin/html-sanitize)"
	@echo "  build              Build por workspace"
	@echo "  audit              Auditoría de dependencias bloqueante (scripts/audit.mjs)"
	@echo "  smoke              Smoke tests por workspace"
	@echo "  openspec-validate  Validar specs/changes de OpenSpec (--all --strict)"
	@echo "  commitlint         Validar commits Git"
	@echo "  ci                 CI gate: openspec-validate + lint + typecheck + build + test-ci + audit"
	@echo "  help               Esta ayuda"
	@echo ""

install:
	npm ci

lint:
	npm run lint

typecheck:
	npm run typecheck

test:
	npm run test

build:
	npm run build

audit:
	npm run audit

smoke:
	npm run test:smoke

# Gate de tests explícito (spec harden-ci-gate): la suite del backend corre UNA
# vez con cobertura (evalúa los umbrales 90%), y web/admin/html-sanitize corren
# sus propias suites.
test-ci:
	npm run test:cov --workspace=apps/backend
	npm run test --workspace=apps/web
	npm run test --workspace=apps/admin
	npm run test --workspace=packages/html-sanitize

openspec-validate:
	npx openspec validate --all --strict

commitlint:
	npx -p @commitlint/cli -p @commitlint/config-conventional commitlint --from HEAD~1 --to HEAD --verbose

ci: openspec-validate lint typecheck build test-ci audit
	@echo ""
	@echo "✅ CI del proyecto completado"