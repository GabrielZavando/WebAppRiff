# Makefile — Riff Catálogo Digital
#
# Monorepo Node (npm workspaces): apps/* + packages/*.
# Todos los targets delegan en scripts npm de la raíz (package.json),
# salvo `openspec-validate` que ejecuta la CLI de OpenSpec (Fission-AI).

.PHONY: help install lint typecheck test build audit smoke test-ci openspec-validate commitlint ci docker-build

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
	@echo "  docker-build       Builds Docker de admin y web con args de prueba (sin push)"
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

# Gate de builds Docker (change deploy-docker-hardening): construye las imágenes
# de admin y web como lo haría Coolify desde un checkout limpio, con args de
# PRUEBA (nunca secretos reales). Web usa REQUIRE_API=false para no depender de
# una API viva durante el CI. Falla si alguno de los dos builds falla; sin push.
docker-build:
	docker build -f apps/admin/Dockerfile -t riff-admin:ci \
		--build-arg FIREBASE_API_KEY=ci-test-firebase-api-key \
		--build-arg FIREBASE_AUTH_DOMAIN=ci-test.firebaseapp.com \
		--build-arg FIREBASE_PROJECT_ID=ci-test-project \
		--build-arg FIREBASE_APP_ID=ci-test-app \
		--build-arg API_BASE_URL=http://localhost:3000/api/v1 \
		.
	docker build -f apps/web/Dockerfile -t riff-web:ci \
		--build-arg SITE_URL=http://localhost:4321 \
		--build-arg NESTJS_API_URL=http://localhost:3000/api/v1 \
		--build-arg REQUIRE_API=false \
		--build-arg PUBLIC_API_URL=http://localhost:3000/api/v1 \
		.
	@echo ""
	@echo "✅ Builds Docker de admin y web completados"