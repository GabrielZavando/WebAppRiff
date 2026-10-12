import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { environment } from '../environment';
import { environment as environmentDevelopmentExample } from '../environment.development.example';
import { environment as environmentProductionExample } from '../environment.production.example';

/**
 * Environment contract for the admin panel (change `admin-panel-foundation`,
 * task 1.1 / design D3): every environment variant must declare the same key
 * set as the committed placeholder `environment.ts`. Real values are injected
 * at build time (fileReplacements + `scripts/write-env.mjs`), never committed.
 */
type NestedKeySet = Record<string, unknown>;

function flattenKeys(value: NestedKeySet, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;
    return child !== null && typeof child === 'object'
      ? flattenKeys(child as NestedKeySet, path)
      : [path];
  });
}

function readSource(relativePath: string): string {
  return readFileSync(resolve(__dirname, relativePath), 'utf-8');
}

describe('environment variants declare the same key set (task 1.1)', () => {
  const expectedKeys = flattenKeys(environment).sort();

  it('exposes the firebase client config + api base url', () => {
    expect(expectedKeys.sort()).toEqual(
      [
        'apiBaseUrl',
        'firebase.apiKey',
        'firebase.appId',
        'firebase.authDomain',
        'firebase.projectId',
      ].sort(),
    );
  });

  it('development example declares the same keys as the placeholder', () => {
    expect(flattenKeys(environmentDevelopmentExample).sort()).toEqual(expectedKeys);
  });

  it('production example declares the same keys as the placeholder', () => {
    expect(flattenKeys(environmentProductionExample).sort()).toEqual(expectedKeys);
  });

  it('the write-env script maps the same keys from build env vars', () => {
    const script = readSource('../../../scripts/write-env.mjs');
    for (const key of expectedKeys) {
      const envVar = key
        .replace(/\./g, '_')
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .toUpperCase();
      expect(script, `script must handle ${envVar}`).toMatch(envVar);
    }
  });

  it('committed environment.ts contains no real credential values', () => {
    const source = readSource('../environment.ts');
    expect(source).toMatch(/PLACEHOLDER|^\s*''/m);
    expect(source).not.toMatch(/AIza[A-Za-z0-9_-]{20,}/);
  });
});
