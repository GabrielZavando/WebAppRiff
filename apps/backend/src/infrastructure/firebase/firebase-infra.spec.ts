import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Valida que la configuración de Firebase esté versionada como código en
 * `apps/backend` y sea consistente para desplegar con `firebase deploy`.
 *
 * No es un test de integración contra Firebase: solo verifica los archivos
 * locales (reglas en lockdown, índices válidos, firebase.json enlazado).
 */
const BACKEND_ROOT = resolve(__dirname, '../../../');

function readRepoFile(name: string): string {
  const full = resolve(BACKEND_ROOT, name);
  if (!existsSync(full)) {
    throw new Error(`Expected ${name} to exist at ${full}`);
  }
  return readFileSync(full, 'utf-8');
}

describe('Firebase infra as code', () => {
  describe('firestore.rules', () => {
    it('denies all client read/write access (lockdown)', () => {
      const rules = readRepoFile('firestore.rules');
      expect(rules).toContain('match /{document=**}');
      expect(rules).toContain('allow read, write: if false;');
      // No client path may be open.
      expect(rules).not.toMatch(/allow\s+read,?\s*write\s*:\s*if\s+true\s*;/);
      expect(rules).not.toMatch(
        /allow\s+read,?\s*write\s*:\s*if\s+request\.auth\s*!=\s*null\s*;/,
      );
    });
  });

  describe('firestore.indexes.json', () => {
    it('is valid JSON declaring indexes and fieldOverrides arrays', () => {
      const parsed = JSON.parse(readRepoFile('firestore.indexes.json'));
      expect(Array.isArray(parsed.indexes)).toBe(true);
      expect(Array.isArray(parsed.fieldOverrides)).toBe(true);
    });
  });

  describe('firebase.json', () => {
    it('references firestore.rules and firestore.indexes.json', () => {
      const parsed = JSON.parse(readRepoFile('firebase.json'));
      expect(parsed.firestore).toBeDefined();
      expect(parsed.firestore.rules).toBe('firestore.rules');
      expect(parsed.firestore.indexes).toBe('firestore.indexes.json');
    });
  });
});
