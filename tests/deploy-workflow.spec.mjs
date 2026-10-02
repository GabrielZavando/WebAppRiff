// Structural tests for .github/workflows/deploy.yml (change: coolify-deploy).
// Runs with: npx vitest run tests/
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const workflowPath = join(repoRoot, ".github", "workflows", "deploy.yml");
const workflow = readFileSync(workflowPath, "utf8");

describe("deploy workflow (.github/workflows/deploy.yml)", () => {
  it("[SC-001] deploy workflow triggers on push to main without legacy gating", () => {
    // Automatic trigger: push restricted to the main branch (post-merge)
    expect(workflow).toMatch(/push:\s*\n\s+branches:\s*\n\s+-\s*main/);
    // Read-only permissions, no checkout-based build pipeline
    expect(workflow).toMatch(/permissions:\s*\n\s+contents:\s*read/);
    // No legacy gating or build/Docker logic (Coolify builds in-situ)
    expect(workflow).not.toMatch(/DEPLOY_ENABLED/);
    expect(workflow).not.toMatch(/appleboy\/ssh-action/);
    expect(workflow).not.toMatch(/docker build/);
  });

  it("[SC-002] deploy workflow invokes both Coolify staging webhooks via curl POST with Bearer", () => {
    expect(workflow).toMatch(/COOLIFY_WEB_STAGING_WEBHOOK_URL/);
    expect(workflow).toMatch(/COOLIFY_ADMIN_STAGING_WEBHOOK_URL/);
    const invocations = workflow.match(/curl --fail --silent --show-error --request POST "\$WEBHOOK_URL" -H "Authorization: Bearer \$COOLIFY_API_TOKEN" --max-time 60/g) ?? [];
    expect(invocations.length).toBe(2);
  });

  it("[SC-003] deploy workflow supports manual workflow_dispatch without DEPLOY_ENABLED", () => {
    expect(workflow).toMatch(/workflow_dispatch:/);
    expect(workflow).not.toMatch(/DEPLOY_ENABLED/);
  });

  it("[SC-004] deploy workflow does not run on pull requests or tag pushes", () => {
    expect(workflow).not.toMatch(/pull_request:/);
    expect(workflow).not.toMatch(/tags:/);
  });

  it("[SC-005] missing webhook secret skips the step with a visible warning", () => {
    const guards = workflow.match(/if \[ -z "\$WEBHOOK_URL" \] \|\| \[ -z "\$COOLIFY_API_TOKEN" \]; then/g) ?? [];
    const warnings = workflow.match(/::warning::/g) ?? [];
    const exits = workflow.match(/exit 0/g) ?? [];
    expect(guards.length).toBe(2);
    expect(warnings.length).toBe(2);
    expect(exits.length).toBe(2);
  });

  it("[SC-006] webhook failures are visible via curl --fail", () => {
    expect(workflow).toMatch(/curl --fail/);
  });

  it("[SC-001] deploy.yml is valid YAML and job steps carry guarded webhook invocations", () => {
    const parsed = parse(workflow); // throws on invalid YAML syntax
    expect(typeof parsed).toBe("object");
    const steps = parsed.jobs["deploy-staging"].steps;
    expect(steps.length).toBe(2);
    for (const step of steps) {
      expect(step.name).toMatch(/^Trigger riff-(web|admin)-staging deploy$/);
      expect(step.env.WEBHOOK_URL).toMatch(/secrets\.COOLIFY_(WEB|ADMIN)_STAGING_WEBHOOK_URL/);
      expect(step.env.COOLIFY_API_TOKEN).toMatch(/secrets\.COOLIFY_API_TOKEN/);
      expect(step.run).toMatch(/if \[ -z "\$WEBHOOK_URL" \] \|\| \[ -z "\$COOLIFY_API_TOKEN" \]; then/);
      expect(step.run).toMatch(/curl --fail --silent --show-error --request POST "\$WEBHOOK_URL" -H "Authorization: Bearer \$COOLIFY_API_TOKEN" --max-time 60/);
    }
  });
});
