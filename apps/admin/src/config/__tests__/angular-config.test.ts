import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Verifies that `apps/admin/angular.json` exists with a build target, plus
 * a `.postcssrc.json` in the project root enabling @tailwindcss/postcss.
 *
 * Initially (task 1.7) we inline `postcssConfig` in build options, but the
 * Angular 18 builder `@angular-devkit/build-angular:application` rejects
 * that key (schema validation). The fallback is a `.postcssrc.json` file
 * at project root, which Angular CLI loads automatically. This is the
 * resolution of Open Question OQ-2 in `design.md`.
 *
 * Source of truth: openspec/changes/design-system-revision/tasks.md (1.7).
 */
type AngularJson = {
  projects?: Record<
    string,
    {
      architect?: {
        build?: {
          options?: {
            styles?: Array<string | { input: string }>;
          };
        };
      };
    }
  >;
};

function readAngularJson(): AngularJson {
  const path = fileURLToPath(
    new URL('../../../angular.json', import.meta.url),
  );
  if (!existsSync(path)) {
    throw new Error(`angular.json not found at ${path}`);
  }
  const raw = readFileSync(path, 'utf-8');
  return JSON.parse(raw) as AngularJson;
}

function readPostcssRc(): string {
  const path = fileURLToPath(
    new URL('../../../.postcssrc.json', import.meta.url),
  );
  if (!existsSync(path)) {
    throw new Error(`.postcssrc.json not found at ${path}`);
  }
  return readFileSync(path, 'utf-8');
}

describe('apps/admin — Tailwind v4 wiring (task 1.7)', () => {
  it('angular.json exists', () => {
    expect(() => readAngularJson()).not.toThrow();
  });

  it('has a build target with options', () => {
    const cfg = readAngularJson();
    const projectNames = Object.keys(cfg.projects ?? {});
    expect(projectNames.length, 'expected at least one project').toBeGreaterThan(0);
    const project = cfg.projects![projectNames[0]!];
    expect(project.architect?.build, 'expected architect.build').toBeDefined();
    expect(project.architect!.build!.options, 'expected build options').toBeDefined();
  });

  it('.postcssrc.json declares @tailwindcss/postcss', () => {
    let src: string;
    try {
      src = readPostcssRc();
    } catch (e) {
      expect.fail((e as Error).message);
    }
    expect(src).toMatch(/@tailwindcss\/postcss/);
  });

  it('styles array includes src/styles/globals.css', () => {
    const cfg = readAngularJson();
    const projectNames = Object.keys(cfg.projects ?? {});
    const project = cfg.projects![projectNames[0]!];
    const styles = project.architect!.build!.options!.styles ?? [];
    const cssInputs = styles.map((s) =>
      typeof s === 'string' ? s : s.input,
    );
    expect(
      cssInputs.some((i) => i.includes('styles/globals.css')),
      'expected globals.css in styles array',
    ).toBe(true);
  });
});
