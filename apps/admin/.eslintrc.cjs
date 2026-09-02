// ESLint config — Angular admin panel (apps/admin)
//
// Sigue la convención de ESLint crudo por workspace (como apps/backend y
// apps/web), en lugar de `ng lint` (que requería @angular-eslint y un architect
// target `lint` no configurado). Los tests reales del panel son Vitest
// (`src/**/*.test.ts`), por lo que se lintea con el parser @typescript-eslint.
//
// Umbrales SOLID alineados con apps/web (warn, no bloquear build):
//   SRP — `max-lines`  (<= 400 líneas por archivo)
//   SRP — `complexity` (ciclomática <= 10 por método)
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
  },
  rules: {
    // ---- SRP thresholds (alineados con apps/web) ----
    'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    'complexity': ['warn', 10],
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '.angular/',
    'coverage/',
    'test-output/',
    '*.spec.ts',
  ],
};
