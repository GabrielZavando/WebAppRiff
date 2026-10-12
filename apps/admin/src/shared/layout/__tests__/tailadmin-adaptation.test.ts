import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * TailAdmin adaptation guard (task 3.2 / spec `admin-app-shell`): every shell
 * component copied from the template must use only Riff `@theme` utilities —
 * no TailAdmin palette classes, no dark-mode variants, no rounded corners and
 * no shadows (flat design).
 */
const SHELL_FILES = [
  'src/shared/layout/app-layout/app-layout.component.html',
  'src/shared/layout/app-sidebar/app-sidebar.component.html',
  'src/shared/layout/app-sidebar/app-sidebar-widget.component.ts',
  'src/shared/layout/app-header/app-header.component.html',
  'src/shared/layout/backdrop/backdrop.component.ts',
  'src/shared/components/ui/button/button.component.ts',
  'src/shared/components/ui/badge/badge.component.ts',
  'src/shared/components/ui/avatar/avatar.component.ts',
  'src/shared/components/ui/dropdown/dropdown.component.ts',
  'src/shared/components/ui/dropdown/dropdown-item/dropdown-item.component.ts',
  'src/shared/components/common/page-breadcrumb/page-breadcrumb.component.ts',
  'src/features/shell/pages/not-found/not-found.component.html',
] as const;

function adminRoot(): string {
  // __dirname = apps/admin/src/shared/layout/__tests__ → apps/admin
  return resolve(__dirname, '../../../..');
}

function read(relative: string): string {
  return readFileSync(resolve(adminRoot(), relative), 'utf-8');
}

describe('TailAdmin adaptation to Riff tokens (task 3.2)', () => {
  it.each(SHELL_FILES)('%s carries no TailAdmin palette or flat-design violations', (file) => {
    const source = read(file);
    expect(source, `${file}: TailAdmin brand palette`).not.toMatch(/brand-\d+/);
    expect(source, `${file}: TailAdmin gray palette`).not.toMatch(/gray-\d+/);
    expect(source, `${file}: dark-mode variant`).not.toMatch(/dark:/);
    expect(source, `${file}: rounded corners`).not.toMatch(/rounded/);
    expect(source, `${file}: shadow utilities`).not.toMatch(/shadow/);
  });

  it('does not import the TailAdmin stylesheet or its theme tokens', () => {
    const sources = SHELL_FILES.map(read).join('\n');
    expect(sources).not.toMatch(/styles\.css/);
    expect(sources).not.toMatch(/shadow-theme/);
    expect(sources).not.toMatch(/menu-item-(active|inactive|icon)/);
    expect(sources).not.toMatch(/text-theme-|bg-dark-|font-outfit/);
  });
});
