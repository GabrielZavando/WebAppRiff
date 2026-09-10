# Design — Audit Blocking

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CI Pipeline (ci.yml)                  │
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  check-refs │───▶│ solid-lint  │───▶│    lint     │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  typecheck  │───▶│    build    │───▶│ test:cov    │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │  test web   │───▶│  test admin │───▶│  test pkg   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│                                                       │
│  ┌─────────────────────────────────────────────────────┐│
│  │              npm run audit (NEW)                    ││
│  │                                                     ││
│  │  ┌─────────────┐    ┌─────────────┐                ││
│  │  │ npm audit   │───▶│ audit.mjs   │───▶ PASS/FAIL  ││
│  │  │ --json      │    │ (suppress)  │                ││
│  │  └─────────────┘    └─────────────┘                ││
│  │                         │                          ││
│  │                         ▼                          ││
│  │                ┌─────────────────┐                 ││
│  │                │ suppressions    │                 ││
│  │                │ .json           │                 ││
│  │                └─────────────────┘                 ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## Components

### npm-audit-suppressions.json

Archivo declarativo en la raíz del monorepo. Formato:

```json
{
  "suppressions": [
    {
      "id": "GHSA-xxxx-xxxx-xxxx",
      "reason": "Depende de upgrade Angular 22 (ticket Q2)",
      "revokedAt": null
    }
  ]
}
```

**Campos**:
- `id` (string, requerido): ID de la vulnerabilidad (formato GHSA o CVE)
- `reason` (string, requerido): Justificación de por qué se suprime
- `revokedAt` (string|null, opcional): Fecha de expiración ISO 8601. `null` = sin expiración

### scripts/audit.mjs

Script Node.js que:

1. Ejecuta `npm audit --audit-level=high --json`
2. Parsea la salida JSON
3. Lee `npm-audit-suppressions.json` (si existe)
4. Filtra vulns suprimidas (sin `revokedAt` o `revokedAt` futuro)
5. Aplica regla de devDependencies (WARNING para high, ERROR para critical)
6. Retorna código distinto de 0 si hay vulns no suprimidas

**Decisiones de diseño**:
- Script separado (no inline en ci.yml) para mantenerability y testabilidad
- Formato JSON propio para suppressions (más legible que formato nativo npm)
- `revokedAt: null` = supresión indefinida (válida hasta eliminar manualmente)
- Critical siempre bloquea sin importar devDependencies

### package.json raíz

Añade script:
```json
{
  "scripts": {
    "audit": "node scripts/audit.mjs"
  }
}
```

### .github/workflows/ci.yml

Cambio en job `project-ci`:
```yaml
# ANTES (no bloqueante):
- name: npm audit (non-blocking, reported)
  run: npm audit --audit-level=high || true

# DESPUÉS (bloqueante):
- name: npm audit (blocking, with suppressions)
  run: npm run audit
```

## Data Flow

```
npm audit --json → audit.mjs → suppressions.json → PASS/FAIL
                    │
                    ├── Lee suppressions
                    ├── Filtra vulns suprimidas
                    ├── Aplica regla devDeps
                    └── Retorna exit code
```

## Tradeoffs

| Decisión | Alternativa | Motivo |
|----------|-------------|--------|
| Script separado | Inline en ci.yml | Mantainability, testability |
| JSON propio para suppressions | Formato nativo npm | Más legible en PRs |
| Critical siempre bloquea | Warning para todos | Seguridad: critical no puede pasar inadvertido |
| `revokedAt: null` = indefinido | Requerir fecha | Flexibilidad: suppression puede ser permanente |
