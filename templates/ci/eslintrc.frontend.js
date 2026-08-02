// ESLint config — Angular frontend
//
// Mechanical enforcement of the SOLID/POO thresholds declared in
// docs/frontend-standards.md § "Principios de Diseño — Frontend (Angular)".
//
// SOLID coverage in this file:
//   SRP — `max-lines`           (<= 400 lines per component file)
//   SRP — `complexity`           (cyclomatic <= 10 per method — aligned with backend threshold for consistency)
//   SRP — @angular-eslint/component-class-size  (declarative check on component class size)
//   DIP — judgemental via @angular-eslint rules around `@Injectable` usage (only mechanical check is "no `new HttpClient()`", not directly lintable)
//
// Honest limitation: SRP smart vs dumb is a *judgement* call that the Lente
// Architect makes in review (Ticket 3 code-auditing §Fase 8). Lint only catches
// size signals. `@angular-eslint` does NOT ship a "dumb component with HTTP
// injection" rule — that requires AST inspection this config cannot produce
// reliably. The Lente Architect covers it.
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { project: './tsconfig.json' },
  plugins: ['@typescript-eslint', 'sonarjs', '@angular-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@angular-eslint/recommended',
    'plugin:@angular-eslint/template-process-inline-templates',
    'plugin:sonarjs/recommended',
  ],
  rules: {
    // ---- SRP thresholds (Ticket 1 §Umbrales frontend-standards.md L61) ----
    // SOLID: SRP — a component file longer than 400 lines signals multiple responsibilities.
    'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],

    // SOLID: SRP — a method with cyclomatic complexity > 10 has too many paths (aligned with backend).
    'complexity': ['error', 10],

    'sonarjs/cognitive-complexity': ['error', 10],

    // SOLID: SRP (smart/dumb) — component-class-size is an indirect signal of responsibility bloat.
    '@angular-eslint/component-class-size': ['error', { maxLineCount: 400 }],

    // SOLID: SRP — inline templates over 60-80 lines should be extracted (Ticket 1 §Umbrales frontend-standards.md L62)
    '@angular-eslint/template/conditional-complexity': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.spec.ts'],
};
