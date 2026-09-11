// ESLint 9 flat config — Astro sites / landing (apps/web)
//
// Migrated from .eslintrc.cjs. Rules:
//   max-lines (<= 400, warn), complexity (<= 10, warn)

import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/', 'node_modules/', '.astro/', '**/*.spec.ts', '**/*.test.ts'],
  },

  // Base recommended configs
  ...tseslint.configs.recommended,

  // Astro recommended (flat config compatible)
  ...astro.configs['flat/recommended'],

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
      // New rule in typescript-eslint v8 — disabled because Astro's
      // `interface Props {}` pattern is idiomatic and harmless
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Override for .d.ts files
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
);
