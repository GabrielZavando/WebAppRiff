// Documentation consistency tests for docs/deploy-standards.md (change: coolify-deploy).
// Runs with: npx vitest run tests/
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const docsPath = join(repoRoot, "docs", "deploy-standards.md");
const docs = readFileSync(docsPath, "utf8");

function extractSection(content, headingPrefix) {
  const start = content.indexOf(`## ${headingPrefix}`);
  if (start === -1) return "";
  const rest = content.slice(start + `## ${headingPrefix}`.length);
  const next = rest.search(/\n## /);
  return next === -1 ? rest : rest.slice(0, next);
}

describe("deploy-standards.md documentation consistency", () => {
  it("[SC-002] Pipeline section documents the Deploy to Coolify webhook workflow", () => {
    const pipeline = extractSection(docs, "Pipeline");
    expect(pipeline).toMatch(/Deploy to Coolify/);
    expect(pipeline).toMatch(/workflow_dispatch/);
    expect(pipeline).toMatch(/COOLIFY_WEB_STAGING_WEBHOOK_URL/);
    expect(pipeline).toMatch(/COOLIFY_ADMIN_STAGING_WEBHOOK_URL/);
    expect(pipeline).toMatch(/curl --fail --silent --show-error/);
  });

  it("[SC-002] Pipeline section no longer describes the legacy SSH/docker pipeline", () => {
    const pipeline = extractSection(docs, "Pipeline");
    expect(pipeline).not.toMatch(/workflow_run/);
    expect(pipeline).not.toMatch(/docker-build/);
    expect(pipeline).not.toMatch(/appleboy/);
    expect(pipeline).not.toMatch(/ssh-action/);
  });

  it("[SC-002] Pipeline section documents the Bearer-authenticated POST invocation", () => {
    const pipeline = extractSection(docs, "Pipeline");
    expect(pipeline).toMatch(/Authorization: Bearer \$COOLIFY_API_TOKEN/);
    expect(pipeline).toMatch(/--request POST/);
  });

  it("[SC-001] Lane frontends describes merge to main triggering the Coolify webhooks", () => {
    const deployFlow = extractSection(docs, "Deploy Flow");
    const laneFrontends = deployFlow.slice(deployFlow.indexOf("### Lane frontends"));
    expect(laneFrontends).toMatch(/Deploy to Coolify/);
    expect(laneFrontends).toMatch(/curl/);
    expect(laneFrontends).toMatch(/riff-web-staging/);
    expect(laneFrontends).toMatch(/riff-admin-staging/);
  });

  it("[SC-005] Staging webhook URL secrets are documented as GitHub Actions secrets", () => {
    expect(docs).toMatch(/\| `COOLIFY_WEB_STAGING_WEBHOOK_URL` \|/);
    expect(docs).toMatch(/\| `COOLIFY_ADMIN_STAGING_WEBHOOK_URL` \|/);
  });

  it("[REQ-006] deploy-standards.md has no DEPLOY_ENABLED references", () => {
    expect(docs).not.toMatch(/DEPLOY_ENABLED/);
  });

  it("[REQ-006] Project-specific stack block reflects the real pipeline", () => {
    const stackBlock = docs.slice(docs.indexOf("## Project-specific stack"));
    expect(stackBlock).toMatch(/Deploy to Coolify/);
    expect(stackBlock).not.toMatch(/docker-build en PRs/);
    expect(stackBlock).not.toMatch(/producción por tag/);
  });
});
