# Deploy Standards

> Personalize this file with the real deployment flow of the project.

## Environments

- `staging`: pre-production testing environment
- `production`: final environment, only after staging smoke tests pass
- Promotion is manual or automatic according to the pipeline

## Pre-deploy Checklist

- All tests pass
- Lint and typecheck without errors
- Build succeeds
- No security vulnerabilities (`npm audit` / `composer audit` / `pip-audit`)

**Exit criteria:** every check passes. If any fails, fix it before proceeding.

## Versioning

- Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`
- `patch`: bug fixes → 1.0.0 → 1.0.1
- `minor`: backward-compatible features → 1.0.0 → 1.1.0
- `major`: breaking changes → 1.0.0 → 2.0.0
- The bump produces: git tag `vX.Y.Z`, commit `release: vX.Y.Z`, and updates the version in the manifest

## Build & Registry

- Build the artifact/image tagged with the version
- Use a multi-stage Dockerfile to reduce size
- Push to the container registry (GHCR / Docker Hub / private)

## Deploy Flow

1. Deploy to `staging`
2. Wait ~30s and run smoke tests (health check + key endpoints)
3. If smoke tests fail → Rollback immediately
4. Deploy to `production` only after staging smoke tests are green
5. Run production smoke tests

## Smoke Tests

- Health check: `GET /health` → 200
- Key domain endpoints
- Automated smoke tests per environment

## Rollback

- Get the previous version from the git tag or registry
- Revert the deployment (kubectl rollout undo / docker-compose / SSH)
- Verify health after rollback

## Notifications

- Notify success/failure to the team channel (Slack/Discord webhook)
- Create a GitHub Release with generated notes

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCKER_REGISTRY` | Container registry URL | `ghcr.io/org` |
| `KUBECONFIG` | Path to kubeconfig (K8s) | `~/.kube/config` |
| `SLACK_WEBHOOK` | Notification webhook | `https://hooks.slack.com/...` |

## Project-specific stack

> Replace with the real stack:

```
Runtime: Node.js 20 / PHP 8.2 / Python 3.11
Container: Docker / Podman
Orchestration: Kubernetes / Docker Compose / SSH
Registry: GHCR / Docker Hub / private
Smoke tests: npm run test:smoke / composer test:smoke / pytest
Rollback: kubectl rollout undo / docker-compose / SSH
```
