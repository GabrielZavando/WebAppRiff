import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowPath = resolve(repoRoot, '.github/workflows/deploy-web-staging.yml');
const listScriptPath = resolve(repoRoot, 'scripts/deploy/list-remote.sh');

const read = (filePath) => readFileSync(filePath, 'utf8');

const topLevelSection = (content, key) => {
  const start = content.indexOf(`\n${key}:\n`);
  if (start === -1) {
    return null;
  }
  const rest = content.slice(start + 1);
  const next = rest.slice(1).search(/\n[A-Za-z_][A-Za-z0-9_-]*:\n/);
  const section = next === -1 ? rest : rest.slice(0, next + 1);
  return section.slice(section.indexOf('\n') + 1);
};

const jobBlock = (content, jobName) => {
  const marker = `\n  ${jobName}:\n`;
  const start = content.indexOf(marker);
  if (start === -1) {
    return null;
  }
  const rest = content.slice(start + marker.length);
  const next = rest.search(/\n {2}[A-Za-z0-9_-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
};

describe('deploy-web-staging workflow contract', () => {
  it('declares the workflow file', () => {
    expect(() => read(workflowPath)).not.toThrow();
  });

  it('triggers only with workflow_dispatch', () => {
    const triggers = topLevelSection(read(workflowPath), 'on');
    expect(triggers).toContain('workflow_dispatch:');
    expect(triggers).not.toMatch(/workflow_run/);
    expect(triggers).not.toMatch(/repository_dispatch/);
    expect(triggers).not.toMatch(/^\s*push:/m);
    expect(triggers).not.toMatch(/^\s*pull_request:/m);
  });

  it('exposes a mode input with listar as default and desplegar as option', () => {
    const triggers = topLevelSection(read(workflowPath), 'on');
    expect(triggers).toMatch(/mode:/);
    expect(triggers).toMatch(/type:\s*choice/);
    expect(triggers).toMatch(/default:\s*listar/);
    expect(triggers).toMatch(/-\s*listar/);
    expect(triggers).toMatch(/-\s*desplegar/);
  });

  it('grants only contents read to the GITHUB_TOKEN', () => {
    const permissions = topLevelSection(read(workflowPath), 'permissions');
    expect(permissions).toMatch(/contents:\s*read/);
    const keys = permissions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
    expect(keys).toEqual(['contents: read']);
  });

  it('uses the deploy-web-staging concurrency group without cancelling runs', () => {
    const concurrency = topLevelSection(read(workflowPath), 'concurrency');
    expect(concurrency).toMatch(/group:\s*deploy-web-staging/);
    expect(concurrency).toMatch(/cancel-in-progress:\s*false/);
  });

  it('pins every used action to a full commit SHA', () => {
    const uses = read(workflowPath).match(/uses:\s*(\S+)/g) ?? [];
    for (const entry of uses) {
      const reference = entry.replace('uses:', '').trim();
      expect(reference).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/);
    }
  });

  it('defines the read-only ftp-access-check job', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).not.toBeNull();
    expect(job).toMatch(/runs-on:\s*ubuntu-latest/);
    expect(job).toMatch(/environment:\s*staging/);
    expect(job).toMatch(/permissions:\s*\n\s+contents:\s*read/);
  });

  it('never writes or deletes in the ftp-access-check job', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).not.toMatch(/\bmirror\b/);
    expect(job).not.toMatch(/\bmrm\b/);
    expect(job).not.toMatch(/\bput\b/);
    expect(job).not.toMatch(/\brm\b/);
    expect(job).not.toMatch(/\bdelete\b/);
  });

  it('runs the listing only in listar mode', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).toMatch(/inputs\.mode\s*==\s*'listar'/);
  });

  it('fails in red when desplegar mode is selected before publication exists', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).toMatch(/inputs\.mode\s*==\s*'desplegar'/);
    expect(job).toMatch(/::error::/);
    expect(job).toMatch(/exit 1/);
  });

  it('passes the FTP secrets to the listing step as environment variables', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).toMatch(/FTP_HOST:\s*\$\{\{\s*secrets\.FTP_HOST\s*\}\}/);
    expect(job).toMatch(/FTP_USER:\s*\$\{\{\s*secrets\.FTP_USER\s*\}\}/);
    expect(job).toMatch(/FTP_PASSWORD:\s*\$\{\{\s*secrets\.FTP_PASSWORD\s*\}\}/);
  });
});

describe('list-remote script contract', () => {
  it('declares the script', () => {
    expect(() => read(listScriptPath)).not.toThrow();
  });

  it('fails fast naming the missing secret', () => {
    const script = read(listScriptPath);
    expect(script).toMatch(/FTP_HOST/);
    expect(script).toMatch(/FTP_USER/);
    expect(script).toMatch(/FTP_PASSWORD/);
    expect(script).toMatch(/::error::/);
    expect(script).toMatch(/exit 1/);
  });

  it('forces TLS, passive mode and port 21', () => {
    const script = read(listScriptPath);
    expect(script).toMatch(/ftp:ssl-force/);
    expect(script).toMatch(/ftp:ssl-protect-data/);
    expect(script).toMatch(/ftp:port 21/);
    expect(script).toMatch(/ftp:passive-mode/);
  });

  it('never prints the credentials', () => {
    const script = read(listScriptPath);
    expect(script).not.toMatch(/echo[^\n]*FTP_PASSWORD/);
    expect(script).not.toMatch(/echo[^\n]*FTP_USER/);
    expect(script).not.toMatch(/echo[^\n]*FTP_HOST/);
    expect(script).not.toMatch(/-u\s+"?\$FTP_USER/);
  });

  it('never writes or deletes remote files', () => {
    const script = read(listScriptPath);
    expect(script).not.toMatch(/\bmirror\b/);
    expect(script).not.toMatch(/\bmrm\b/);
    expect(script).not.toMatch(/\bput\b/);
    expect(script).not.toMatch(/--delete/);
  });
});
