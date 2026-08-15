// ESLint config — NestJS / Node backend (apps/backend)
//
// Adaptado de templates/ci/eslintrc.backend.js para el scaffold del workspace.
// En este change se mantienen SOLO los umbrales SOLID mecánicamente verificables
// que son reglas CORE de ESLint (sin plugins externos), conforme a
// docs/backend-standards.md § "Principios de Diseño — Backend (NestJS)":
//   SRP — `max-lines`   (<= 300 líneas por archivo)
//   SRP — `complexity`  (ciclomática <= 10 por método)
//
// DIFERIDO a backend-commons (requiere añadir deps al package.json, no en este
// change por decisión de diseño "no añadir dependencias nuevas"):
//   - `sonarjs/cognitive-complexity` (plugin eslint-plugin-sonarjs, hoisted de apps/web)
//   - `import/no-cycle`              (plugin eslint-plugin-import, NO instalado)
// DIP se aplica via templates/ci/.dependency-cruiser.js (regla no-infra-from-domain),
// copiada a apps/backend/.dependency-cruiser.js como guard preventivo.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // ---- SRP thresholds (docs/backend-standards.md § Umbrales objetivos) ----
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'complexity': ['error', 10],
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/', '*.spec.ts', '*.contract.spec.ts'],
};
