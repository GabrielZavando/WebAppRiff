// ESLint config — shared package html-sanitize (packages/html-sanitize)
//
// Paquete compartido usado por backend (CJS) y frontend (ESM via Vite).
// ESLint crudo con @typescript-eslint, sin type-aware project (el tsconfig
// excluye los *.spec.ts, y el surface es mínimo: index.ts + index.spec.ts).
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
};
