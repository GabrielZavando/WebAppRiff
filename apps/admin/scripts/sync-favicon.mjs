/**
 * Copies the favicon binary from apps/web/public into this app's generated
 * assets dir (src/favicon/, gitignored) so the Angular build can emit it at
 * /logo_riff.png — same file and same URL as the public site (design D4 of
 * change deploy-docker-hardening).
 *
 * Why generated and not committed: Angular's asset `input` must be inside the
 * app workspace root (apps/admin; see normalize-asset-patterns in the build
 * builder), while the single source of truth for the logo lives in
 * apps/web/public. Copying at build time keeps one binary and guarantees the
 * admin favicon never drifts from the web one. Mirrors the write-env.mjs
 * pattern (gitignored generated files).
 *
 * Runs as the `prebuild` npm hook (host builds and the Dockerfile build alike;
 * in Docker the source is provided by COPY apps/web/public/logo_riff.png).
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
// apps/web/public is a sibling of this app inside apps/*.
const sourcePath = resolve(appRoot, '../web/public/logo_riff.png');
const targetDir = resolve(appRoot, 'src/favicon');
const targetPath = resolve(targetDir, 'logo_riff.png');

if (existsSync(sourcePath)) {
  mkdirSync(targetDir, { recursive: true });
  copyFileSync(sourcePath, targetPath);
  console.log(`[sync-favicon] copied ${sourcePath} -> ${targetPath}`);
} else if (existsSync(targetPath)) {
  console.warn(
    `[sync-favicon] WARNING: source ${sourcePath} not found; keeping existing ${targetPath}`,
  );
} else {
  console.warn(
    `[sync-favicon] WARNING: source ${sourcePath} not found; admin will serve no favicon (404)`,
  );
}
