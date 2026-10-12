import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * REGRESSION GUARD (manual-verification bug 1): Angular does NOT apply
 * fileReplacements in cascade — only replacements against the ORIGINAL file
 * (`environment.ts`) take effect. A chained replacement
 * (`environment.ts → environment.development.ts → environment.development.local.ts`)
 * silently left the dev bundle on the committed placeholders, so the login
 * went to identitytoolkit with `key=dev-placeholder-api-key` instead of the
 * dev's real API key (caught only in manual verification).
 *
 * The development configuration must therefore declare EXACTLY ONE
 * replacement against `environment.ts`. This test pins that shape so the
 * cascade cannot come back. Real-bundle coverage lives in the smoke E2E
 * (`e2e/login.spec.ts`), which asserts the request key matches the env file.
 */
type FileReplacement = { replace: string; with: string };

type AngularJson = {
  projects?: Record<
    string,
    {
      architect?: {
        build?: {
          configurations?: Record<string, { fileReplacements?: FileReplacement[] }>;
        };
      };
    }
  >;
};

function adminRoot(): string {
  // __dirname = apps/admin/src/environments/__tests__ → apps/admin
  return resolve(__dirname, '../../..');
}

function readConfig(): AngularJson {
  return JSON.parse(readFileSync(resolve(adminRoot(), 'angular.json'), 'utf-8')) as AngularJson;
}

describe('fileReplacements stay single-level (manual-verification bug 1)', () => {
  it('development replaces environment.ts ONCE, with the generated local file', () => {
    const config = readConfig();
    const replacements =
      config.projects?.['admin']?.architect?.build?.configurations?.['development']
        ?.fileReplacements ?? [];

    expect(replacements).toHaveLength(1);
    expect(replacements[0]).toEqual({
      replace: 'src/environments/environment.ts',
      with: 'src/environments/environment.development.local.ts',
    });
  });

  it('production keeps its single replacement (untouched flow)', () => {
    const config = readConfig();
    const replacements =
      config.projects?.['admin']?.architect?.build?.configurations?.['production']
        ?.fileReplacements ?? [];

    expect(replacements).toEqual([
      {
        replace: 'src/environments/environment.ts',
        with: 'src/environments/environment.production.ts',
      },
    ]);
  });

  it('the dev bootstrap placeholders match the committed example (no drift)', () => {
    const script = readFileSync(resolve(adminRoot(), 'scripts/write-env.mjs'), 'utf-8');
    const example = readFileSync(
      resolve(adminRoot(), 'src/environments/environment.development.example.ts'),
      'utf-8',
    );

    const pairs: Array<[string, string]> = [
      ['FIREBASE_API_KEY', 'apiKey'],
      ['FIREBASE_AUTH_DOMAIN', 'authDomain'],
      ['FIREBASE_PROJECT_ID', 'projectId'],
      ['FIREBASE_APP_ID', 'appId'],
    ];
    for (const [envVar, configKey] of pairs) {
      const scriptValue = script.match(new RegExp(`${envVariablePattern(envVar)}: '([^']*)'`))?.[1];
      const exampleValue = example.match(new RegExp(`${configKey}: '([^']*)'`))?.[1];
      expect(scriptValue, `${envVar} in write-env.mjs`).toBeTruthy();
      expect(
        exampleValue,
        `${configKey} in environment.development.example.ts`,
      ).toBeTruthy();
      expect(scriptValue).toBe(exampleValue);
    }
  });
});

/** Matches a SCREAMING_SNAKE env var name in the script's defaults map. */
function envVariablePattern(name: string): string {
  return name.replace(/_/g, '\\_');
}
