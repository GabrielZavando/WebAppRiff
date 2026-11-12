import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const repoRoot = process.cwd();
const cleanupScript = join(repoRoot, 'scripts/deploy/cleanup-stale-html.sh');

const makeDist = (htmlFiles) => {
  const dir = mkdtempSync(join(tmpdir(), 'cleanup-test-'));
  for (const file of htmlFiles) {
    const filePath = join(dir, file);
    mkdirSync(join(dir, dirname(file)), { recursive: true });
    writeFileSync(filePath, '<html></html>');
  }
  return dir;
};

describe('cleanup-stale-html.sh — guarda de build incompleto (tarea 9.6)', () => {
  const env = {
    ...process.env,
    FTP_HOST: 'example.com',
    FTP_USER: 'user',
    FTP_PASSWORD: 'pass',
  };

  it('aborta sin borrar cuando falta dist/404.html', () => {
    const dist = makeDist(['index.html', 'productos/a.html', 'productos/b.html', 'categorias/a.html', 'categorias/b.html']);
    let stderr = '';
    try {
      execFileSync('bash', [cleanupScript, dist, 'dry-run'], { env, encoding: 'utf8' });
    } catch (err) {
      stderr = err.stderr || '';
    }
    expect(stderr).toContain('Falta dist/404.html en el build');
    rmSync(dist, { recursive: true, force: true });
  });

  it('aborta sin borrar cuando falta dist/index.html', () => {
    const dist = makeDist(['404.html', 'productos/a.html', 'productos/b.html', 'categorias/a.html', 'categorias/b.html']);
    try {
      execFileSync('bash', [cleanupScript, dist, 'dry-run'], { env, encoding: 'utf8' });
    } catch (err) {
      expect(err.status).toBe(1);
      expect(err.stderr).toContain('Falta dist/index.html en el build');
    }
    rmSync(dist, { recursive: true, force: true });
  });

  it('aborta sin borrar cuando hay menos de 5 documentos HTML en el build', () => {
    const dist = makeDist(['index.html', '404.html', 'contacto.html']);
    let output = '';
    try {
      execFileSync('bash', [cleanupScript, dist, 'dry-run'], { env, encoding: 'utf8' });
    } catch (err) {
      output = err.stdout || err.stderr || String(err);
    }
    expect(output).toContain('solo tiene 3 documentos HTML');
    rmSync(dist, { recursive: true, force: true });
  });

  it('pasa la guarda de build mínimo cuando hay 5 o más HTML incluyendo index y 404', () => {
    const dist = makeDist(['index.html', '404.html', 'a.html', 'b.html', 'c.html']);
    let output = '';
    try {
      execFileSync('bash', [cleanupScript, dist, 'dry-run'], { env, encoding: 'utf8' });
    } catch (err) {
      output = err.stdout || err.stderr || String(err);
    }
    expect(output).not.toContain('Falta dist/');
    expect(output).not.toContain('solo tiene');
    expect(output).not.toContain('guarda de build mínimo');
    rmSync(dist, { recursive: true, force: true });
  });
});
