import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Root postinstall hook: builds the shared @riff/html-sanitize workspace
 * package when its source is present. Filtered installs (npm ci
 * --workspace=<other-app>, Docker app stages) may not include this workspace
 * at all — in that case the build is skipped instead of failing the install.
 */
const manifest = 'packages/html-sanitize/tsconfig.cjs.json';

if (existsSync(manifest)) {
  execSync('npm run build --workspace=@riff/html-sanitize', { stdio: 'inherit' });
} else {
  console.log('[postinstall] html-sanitize workspace not present — skipping build');
}
