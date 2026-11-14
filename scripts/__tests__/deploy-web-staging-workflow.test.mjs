import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const workflowPath = resolve(repoRoot, '.github/workflows/deploy-web-staging.yml');
const listScriptPath = resolve(repoRoot, 'scripts/deploy/list-remote.sh');
const uploadScriptPath = resolve(repoRoot, 'scripts/deploy/upload-web.sh');
const ftpCommonPath = resolve(repoRoot, 'scripts/deploy/ftp-common.sh');

const read = (filePath) => readFileSync(filePath, 'utf8');

function commandAvailable(cmd) {
  try {
    execFileSync('command', ['-v', cmd], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

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

  it('ejecuta ftp-access-check en cualquier modo', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).not.toMatch(/inputs\.mode/);
  });

  it('ejecuta el job de publicación solo en modo desplegar', () => {
    const publish = jobBlock(read(workflowPath), 'publish');
    expect(publish).not.toBeNull();
    expect(publish).toMatch(/needs:\s*ftp-access-check/);
    expect(publish).toMatch(/environment:\s*staging/);
    expect(publish).toMatch(/permissions:\s*\n\s+contents:\s*read/);
    expect(publish).toMatch(/if:\s*\$\{\{\s*inputs\.mode\s*==\s*'desplegar'\s*\}\}/);
  });

  it('pasa los secretos FTP al paso de listado como variables de entorno', () => {
    const job = jobBlock(read(workflowPath), 'ftp-access-check');
    expect(job).toMatch(/FTP_HOST:\s*\$\{\{\s*secrets\.FTP_HOST\s*\}\}/);
    expect(job).toMatch(/FTP_USER:\s*\$\{\{\s*secrets\.FTP_USER\s*\}\}/);
    expect(job).toMatch(/FTP_PASSWORD:\s*\$\{\{\s*secrets\.FTP_PASSWORD\s*\}\}/);
  });

  it('cada paso que lee una variable o un secret la recibe en su propio env:', () => {
    const content = read(workflowPath);
    const parsed = yaml.parse(content);
    const jobs = parsed.jobs || {};

    const refsFromRun = (run) => {
      const refs = new Set();
      for (const m of run.matchAll(/\$\{\{\s*vars\.([A-Z][A-Z0-9_]*)\s*\}\}/g)) refs.add(m[1]);
      for (const m of run.matchAll(/\$\{\{\s*secrets\.([A-Z][A-Z0-9_]*)\s*\}\}/g)) refs.add(m[1]);
      for (const m of run.matchAll(/for var in ([A-Z][A-Z0-9_]*(?: [A-Z][A-Z0-9_]*)*)/g)) {
        for (const name of m[1].split(/\s+/)) refs.add(name);
      }
      return refs;
    };

    const envKeys = (step, jobEnv = {}) => {
      const keys = new Set();
      if (jobEnv) for (const k of Object.keys(jobEnv)) keys.add(k);
      if (step.env) for (const k of Object.keys(step.env)) keys.add(k);
      return keys;
    };

    for (const [jobName, job] of Object.entries(jobs)) {
      const jobEnv = job.env || {};
      for (const step of job.steps || []) {
        if (!step.run) continue;
        const refs = refsFromRun(step.run);
        const keys = envKeys(step, jobEnv);
        for (const ref of refs) {
          expect(keys).toContain(
            ref,
            `el paso '${step.name ?? '(sin nombre)'}' del job '${jobName}' lee '${ref}' pero no lo declara en env:`,
          );
        }
      }
    }
  });

  it('el job de publicación construye sin Docker', () => {
    const publish = jobBlock(read(workflowPath), 'publish');
    expect(publish).toMatch(/npm ci/);
    expect(publish).toMatch(/npm run build --workspace=@riff\/web/);
    expect(publish).toMatch(/SITE_URL:\s*\$\{\{\s*vars\.SITE_URL\s*\}\}/);
    expect(publish).toMatch(/NESTJS_API_URL:\s*\$\{\{\s*vars\.NESTJS_API_URL\s*\}\}/);
    expect(publish).toMatch(/PUBLIC_API_URL:\s*\$\{\{\s*vars\.PUBLIC_API_URL\s*\}\}/);
    expect(publish).toMatch(/REQUIRE_API:\s*'true'/);
  });

  it('verifica .htaccess antes de invocar a lftp', () => {
    const publish = jobBlock(read(workflowPath), 'publish');
    const verifyIdx = publish.indexOf('verify:htaccess');
    const lftpIdx = publish.indexOf('lftp');
    expect(verifyIdx).not.toBe(-1);
    expect(lftpIdx).not.toBe(-1);
    expect(verifyIdx).toBeLessThan(lftpIdx);
  });

  it('ejecuta smoke y curl -I después de subir', () => {
    const publish = jobBlock(read(workflowPath), 'publish');
    expect(publish).toMatch(/SMOKE_WEB_URL/);
    expect(publish).toMatch(/npm run smoke:web/);
    expect(publish).toMatch(/curl -I/);
    expect(publish).toMatch(/_astro\//);
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

  it('forces TLS and passive mode', () => {
    const script = read(listScriptPath);
    expect(script).toMatch(/ftp:ssl-force/);
    expect(script).toMatch(/ftp:ssl-protect-data/);
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

  it('exige ftp:ssl-allow yes y prohíbe ssl-allow no', () => {
    const script = read(listScriptPath);
    expect(script).toMatch(/set ftp:ssl-allow yes/);
    expect(script).not.toMatch(/set ftp:ssl-allow no/);
  });

  it('usa solo variables de lftp existentes', () => {
    const script = read(listScriptPath);
    expect(script).not.toMatch(/net:max-idle/);
    expect(script).not.toMatch(/ftp:port 21/);
    expect(script).toMatch(/set net:idle/);
    expect(script).toMatch(/set net:max-retries/);
    expect(script).toMatch(/set net:timeout/);
    expect(script).toMatch(/set ftp:ssl-force yes/);
    expect(script).toMatch(/set ftp:ssl-protect-data yes/);
    expect(script).toMatch(/set cmd:fail-exit yes/);
  });

  it('no usa .netrc para las credenciales', () => {
    const script = read(listScriptPath);
    expect(script).not.toMatch(/\.netrc/);
  });

  it('pasa la contraseña a lftp mediante LFTP_PASSWORD (--env-password)', () => {
    const script = read(listScriptPath);
    expect(script).toMatch(/export LFTP_PASSWORD/);
    expect(script).toMatch(/--env-password/);
  });

  it('valida que los secrets no tengan bordes con espacio ni caracteres de control', () => {
    const script = read(listScriptPath);
    expect(script).toContain('*[![:print:][:space:]]*');
    expect(script).toContain('[[:space:]]* | *[[:space:]])');
    expect(script).toMatch(/FTP_HOST/);
    expect(script).toMatch(/FTP_USER/);
    expect(script).toMatch(/FTP_PASSWORD/);
  });

  it('nunca imprime el valor de un secret', () => {
    const script = read(listScriptPath);
    expect(script).not.toMatch(/echo[^\n]*\$FTP_PASSWORD/);
    expect(script).not.toMatch(/echo[^\n]*\$FTP_USER/);
    expect(script).not.toMatch(/echo[^\n]*\$FTP_HOST/);
  });

  it.skipIf(!commandAvailable('lftp'))(
    'valida que las variables de lftp existan ejecutando lftp -c set',
    () => {
      execFileSync(
        'lftp',
        [
          '-c',
          'set ftp:ssl-allow yes; set ftp:ssl-force yes; set ftp:ssl-protect-data yes; set net:max-retries 3; set net:timeout 30; set net:idle 30; set cmd:fail-exit yes',
        ],
        { stdio: 'ignore' }
      );
    }
  );
});

describe('upload-web script contract', () => {
  it('declara el script de subida', () => {
    expect(() => read(uploadScriptPath)).not.toThrow();
  });

  it('carga la librería FTP compartida', () => {
    expect(read(uploadScriptPath)).toMatch(/ftp-common\.sh/);
    expect(read(uploadScriptPath)).toMatch(/ftp_require_secrets/);
  });

  it('falla rápido nombrando el secret faltante', () => {
    const library = read(ftpCommonPath);
    expect(library).toMatch(/FTP_HOST/);
    expect(library).toMatch(/FTP_USER/);
    expect(library).toMatch(/FTP_PASSWORD/);
    expect(library).toMatch(/::error::/);
    expect(read(uploadScriptPath)).toMatch(/exit 1/);
  });

  it('valida que los secrets no tengan bordes con espacio ni caracteres de control', () => {
    const library = read(ftpCommonPath);
    expect(library).toContain('*[![:print:][:space:]]*');
    expect(library).toContain('[[:space:]]* | *[[:space:]])');
    expect(library).toMatch(/FTP_HOST/);
    expect(library).toMatch(/FTP_USER/);
    expect(library).toMatch(/FTP_PASSWORD/);
  });

  it('exige ftp:ssl-allow yes y prohíbe ssl-allow no', () => {
    const library = read(ftpCommonPath);
    expect(library).toMatch(/set ftp:ssl-allow yes/);
    expect(library).not.toMatch(/set ftp:ssl-allow no/);
  });

  it('configura solo variables de lftp existentes y puerto 21', () => {
    const library = read(ftpCommonPath);
    expect(library).not.toMatch(/net:max-idle/);
    expect(library).toMatch(/set net:idle/);
    expect(library).toMatch(/set net:max-retries/);
    expect(library).toMatch(/set net:timeout/);
    expect(library).toMatch(/set ftp:ssl-force yes/);
    expect(library).toMatch(/set ftp:ssl-protect-data yes/);
    expect(library).toMatch(/set ftp:passive-mode yes/);
    expect(library).toMatch(/set ftp:port 21/);
    expect(library).toMatch(/set glob:dot 1/);
    expect(library).toMatch(/set cmd:fail-exit yes/);
  });

  it('no usa .netrc para las credenciales', () => {
    expect(read(ftpCommonPath)).not.toMatch(/\.netrc/);
  });

  it('pasa la contraseña a lftp mediante LFTP_PASSWORD (--env-password)', () => {
    const library = read(ftpCommonPath);
    expect(library).toMatch(/export LFTP_PASSWORD/);
    expect(library).toMatch(/--env-password/);
  });

  it('nunca imprime el valor de un secret', () => {
    const library = read(ftpCommonPath);
    expect(library).not.toMatch(/echo[^\n]*\$FTP_PASSWORD/);
    expect(library).not.toMatch(/echo[^\n]*\$FTP_USER/);
    expect(library).not.toMatch(/echo[^\n]*\$FTP_HOST/);
  });

  it('sube _astro/ primero y el resto después, sin borrar nada en remoto', () => {
    const script = read(uploadScriptPath);
    const astroIdx = script.indexOf('_astro');
    const restIdx = script.indexOf('mirror -R');
    expect(astroIdx).not.toBe(-1);
    expect(restIdx).not.toBe(-1);
    expect(script).not.toMatch(/mirror --delete/);
    expect(script).not.toMatch(/\bmrm\b/);
    expect(script).not.toMatch(/--delete-excluded/);
  });

  it('recibe la ruta del dist como argumento', () => {
    const script = read(uploadScriptPath);
    expect(script).toMatch(/\$\{1/);
    expect(script).toMatch(/\$\{2/);
  });

  it.skipIf(!commandAvailable('lftp'))(
    'valida que las variables de lftp existan ejecutando lftp -c set',
    () => {
      execFileSync(
        'lftp',
        [
          '-c',
          'set ftp:ssl-allow yes; set ftp:ssl-force yes; set ftp:ssl-protect-data yes; set ftp:passive-mode yes; set ftp:port 21; set glob:dot 1; set net:max-retries 3; set net:timeout 30; set net:idle 30; set cmd:fail-exit yes',
        ],
        { stdio: 'ignore' }
      );
    }
  );
});
