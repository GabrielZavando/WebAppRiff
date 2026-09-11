// ESLint 9 flat config — NestJS / Node backend (apps/backend)
//
// Migrated from .eslintrc.cjs. Equivalent rules:
//   SRP — max-lines (<= 300), complexity (<= 10)

import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', '**/*.spec.ts', '**/*.contract.spec.ts'],
  },

  // Base recommended configs
  ...tseslint.configs.recommended,

  // Project-specific rules
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // SRP thresholds (docs/backend-standards.md § Umbrales objetivos)
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'complexity': ['error', 10],
    },
  },
);
