// ESLint 9 flat config — Angular admin panel (apps/admin)
//
// Migrated from .eslintrc.cjs. Rules:
//   max-lines (<= 400, warn), complexity (<= 10, warn)

import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', '.angular/', 'coverage/', 'test-output/', '**/*.spec.ts'],
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
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
      'complexity': ['warn', 10],
    },
  },
);
