import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const uploadAdminPath = resolve(repoRoot, 'scripts/deploy/upload-admin.sh');
const ftpCommonPath = resolve(repoRoot, 'scripts/deploy/ftp-common.sh');
const uploadWebPath = resolve(repoRoot, 'scripts/deploy/upload-web.sh');

const read = (filePath) => readFileSync(filePath, 'utf8');

const stripCommentLines = (content) =>
  content
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n');

describe('upload-admin script contract', () => {
  it('declares the script', () => {
    expect(() => read(uploadAdminPath)).not.toThrow();
  });

  it('fails fast on unset shell options', () => {
    expect(read(uploadAdminPath)).toMatch(/set -euo pipefail/);
  });

  it('loads the shared FTP library', () => {
    expect(read(uploadAdminPath)).toMatch(/ftp-common\.sh/);
  });

  it('runs the environment generation, build and gates in order', () => {
    const script = read(uploadAdminPath);
    const envIdx = script.indexOf('write-env.mjs');
    const buildIdx = script.indexOf('npm run build --workspace=@riff/admin');
    const htaccessIdx = script.indexOf(
      'npm run verify:htaccess --workspace=@riff/admin',
    );
    const markersIdx = script.indexOf('check:bundle');
    expect(envIdx).not.toBe(-1);
    expect(buildIdx).not.toBe(-1);
    expect(htaccessIdx).not.toBe(-1);
    expect(markersIdx).not.toBe(-1);
    expect(envIdx).toBeLessThan(buildIdx);
    expect(buildIdx).toBeLessThan(htaccessIdx);
    expect(htaccessIdx).toBeLessThan(markersIdx);
  });

  it('generates the production environment without --if-missing', () => {
    const script = read(uploadAdminPath);
    const envLine = script
      .split('\n')
      .find((line) => line.includes('write-env.mjs'));
    expect(envLine).toBeDefined();
    expect(envLine).toMatch(/--target=prod/);
    expect(envLine).not.toMatch(/--if-missing/);
  });

  it('never performs a remote delete operation', () => {
    const script = stripCommentLines(read(uploadAdminPath));
    const withoutLocalCleanup = script
      .split('\n')
      .filter((line) => !line.includes('SESSION_DIR'))
      .join('\n');
    expect(script).not.toMatch(/mirror[^\n]*--delete/);
    expect(script).not.toMatch(/\bmrm\b/);
    expect(script).not.toMatch(/--delete-excluded/);
    expect(script).not.toMatch(/--remove/);
    expect(withoutLocalCleanup).not.toMatch(/^\s*rm\s+-r/m);
  });

  it('requires the five build variables and rejects invalid values', () => {
    const script = read(uploadAdminPath);
    for (const name of [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_APP_ID',
      'API_BASE_URL',
    ]) {
      expect(script).toContain(name);
    }
    expect(script).toMatch(/https:\/\//);
    expect(script).toContain('dev-placeholder');
    expect(script).toContain('bundle-smoke');
  });

  it('names the concrete variable when the validation fails', () => {
    const script = read(uploadAdminPath);
    expect(script).toMatch(/::error::/);
    expect(script).toMatch(/exit 1/);
  });

  it('keeps plan mode as the default and requires --publish to write', () => {
    const script = read(uploadAdminPath);
    expect(script).toMatch(/--publish/);
    expect(script).toMatch(/PUBLISH_MODE/);
    const guardIdx = script.indexOf('if [[ "$PUBLISH_MODE" -eq 1 ]]');
    const uploadIdx = script.indexOf('publish_to_hosting', guardIdx);
    expect(guardIdx).not.toBe(-1);
    expect(uploadIdx).not.toBe(-1);
    expect(uploadIdx).toBeGreaterThan(guardIdx);
  });

  it('guards against the public site hosting account', () => {
    const script = read(uploadAdminPath);
    expect(script).toContain('_astro');
    expect(script).toContain('404.html');
  });

  it('verifies the publication over HTTP', () => {
    const script = read(uploadAdminPath);
    expect(script).toMatch(/SMOKE_ADMIN_URL/);
    expect(script).toMatch(/smoke\/admin\.mjs/);
    expect(script).toMatch(/\/products/);
    expect(script).toMatch(/curl/);
  });
});

describe('admin upload command file order', () => {
  const buildFakeDist = () => {
    const dist = mkdtempSync(join(tmpdir(), 'admin-dist-'));
    writeFileSync(join(dist, 'index.html'), '<app-root></app-root>');
    writeFileSync(join(dist, 'main-ABC123.js'), 'console.log(1);');
    writeFileSync(join(dist, 'chunk-XYZ789.js'), 'console.log(2);');
    writeFileSync(join(dist, 'styles-CSS.css'), 'body{}');
    writeFileSync(join(dist, 'logo_riff.png'), 'png');
    writeFileSync(join(dist, '.htaccess'), 'RewriteEngine On');
    mkdirSync(join(dist, 'media'));
    writeFileSync(join(dist, 'media', 'font.woff2'), 'woff');
    mkdirSync(join(dist, 'assets', 'img'), { recursive: true });
    writeFileSync(join(dist, 'assets', 'img', 'logo.webp'), 'webp');
    return dist;
  };

  const generateCommandFile = (dist) => {
    const out = join(mkdtempSync(join(tmpdir(), 'admin-cmd-')), 'lftp-commands');
    const script = read(uploadAdminPath);
    const functionBlock = script
      .split('\n')
      .filter((line) => true)
      .join('\n');
    execFileSync(
      'bash',
      [
        '-c',
        `source <(sed -n '/^write_admin_command_file()/,/^}/p' "${uploadAdminPath}"); write_admin_command_file "${out}" "${dist}"`,
      ],
      { stdio: 'pipe' },
    );
    expect(functionBlock.length).toBeGreaterThan(0);
    return read(out);
  };

  it('uploads the content-hashed assets first', () => {
    const commands = generateCommandFile(buildFakeDist());
    const hashedIdx = commands.indexOf('main-ABC123.js');
    const mediaIdx = commands.indexOf('/media');
    expect(hashedIdx).not.toBe(-1);
    expect(mediaIdx).not.toBe(-1);
    expect(hashedIdx).toBeLessThan(mediaIdx);
  });

  it('uploads the .htaccess after the static assets and before the bootstrap', () => {
    const commands = generateCommandFile(buildFakeDist());
    const logoIdx = commands.indexOf('logo_riff.png');
    const htaccessIdx = commands.indexOf('-o .htaccess');
    const indexIdx = commands.indexOf('-o index.html');
    expect(logoIdx).not.toBe(-1);
    expect(htaccessIdx).not.toBe(-1);
    expect(indexIdx).not.toBe(-1);
    expect(logoIdx).toBeLessThan(htaccessIdx);
    expect(htaccessIdx).toBeLessThan(indexIdx);
  });

  it('uploads the SPA bootstrap last', () => {
    const commands = generateCommandFile(buildFakeDist());
    const indexIdx = commands.indexOf('-o index.html');
    for (const marker of [
      'main-ABC123.js',
      'chunk-XYZ789.js',
      'styles-CSS.css',
      '/media',
      '/assets',
      'logo_riff.png',
      '-o .htaccess',
    ]) {
      expect(commands.indexOf(marker)).toBeLessThan(indexIdx);
    }
  });

  it('never emits a delete command', () => {
    const commands = generateCommandFile(buildFakeDist());
    expect(commands).not.toMatch(/--delete/);
    expect(commands).not.toMatch(/\bmrm\b/);
    expect(commands).not.toMatch(/^\s*rm\s/m);
  });
});

describe('shared FTP library contract', () => {
  it('declares the library', () => {
    expect(() => read(ftpCommonPath)).not.toThrow();
  });

  it('is loaded by both publication lanes', () => {
    expect(read(uploadWebPath)).toMatch(/ftp-common\.sh/);
    expect(read(uploadAdminPath)).toMatch(/ftp-common\.sh/);
  });

  it('does not duplicate the secret validation in the lanes', () => {
    const validationSignature = '*[![:print:][:space:]]*';
    expect(read(ftpCommonPath)).toContain(validationSignature);
    expect(read(uploadWebPath)).not.toContain(validationSignature);
    expect(read(uploadAdminPath)).not.toContain(validationSignature);
  });

  it('forces TLS, passive mode, dotfiles and port 21', () => {
    const library = read(ftpCommonPath);
    expect(library).toMatch(/set ftp:ssl-allow yes/);
    expect(library).not.toMatch(/set ftp:ssl-allow no/);
    expect(library).toMatch(/set ftp:ssl-force yes/);
    expect(library).toMatch(/set ftp:ssl-protect-data yes/);
    expect(library).toMatch(/set ftp:passive-mode yes/);
    expect(library).toMatch(/set ftp:port 21/);
    expect(library).toMatch(/set glob:dot 1/);
    expect(library).toMatch(/set cmd:fail-exit yes/);
  });

  it('never prints the credentials and never uses a .netrc', () => {
    const library = read(ftpCommonPath);
    expect(library).toMatch(/export LFTP_PASSWORD/);
    expect(library).toMatch(/--env-password/);
    expect(library).not.toMatch(/\.netrc/);
    expect(library).not.toMatch(/echo[^\n]*\$FTP_PASSWORD/);
    expect(library).not.toMatch(/echo[^\n]*\$FTP_USER/);
    expect(library).not.toMatch(/echo[^\n]*\$FTP_HOST/);
  });
});
