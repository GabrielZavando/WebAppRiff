# Skill: code-auditing

## Descripción

Auditoría adversarial de calidad de código. Ejecútala antes de archivar un cambio para detectar fallos costosos, peligrosos o difíciles de detectar. **No duplica `/verify`** (este se encarga de la cobertura de requisitos y tareas); este paso se enfoca en robustez, seguridad ofensiva, tradeoffs y diseño contextual. **Read-only sobre código**: reporta hallazgos y persiste su veredicto en `openspec/state/adversarial-result.json`, pero nunca modifica código.

## Paso 1 — Cargar contexto del cambio (token-light)

- `ls openspec/changes/` → cambio activo. Si hay varios, pedir al usuario cuál auditar.
- Leer `proposal.md` (el "por qué" y el "qué" del cambio).
- `git diff --stat` → lista resumida de archivos modificados.
- `git status` → árbol de trabajo (archivos modificados/stageados; insumo del Paso 6).
- **No** leer `scenarios.md`/`requirements.md`/`tasks.md` completos (eso es `/verify`).

## Paso 2 — Ejecutar herramientas automáticas

- `npm audit --json` (si existe `package.json`) → parsear vulnerabilidades reales de dependencias.
- `npx eslint -c templates/ci/eslintrc.backend.js --format json src/` y, según corresponda, `templates/ci/eslintrc.frontend.js` o `templates/ci/eslintrc.astro.js` → parsear violaciones SRP (`max-lines`, `max-params`), DIP, ISP.
- `npx dependency-cruiser --config templates/ci/.dependency-cruiser.js src/` → validar regla `no-infra-from-domain` (ningún archivo en `domain/` o `application/` importe infraestructura).
- **Pasar los JSON resultantes al LLM para interpretar y priorizar**, no para leer código línea por línea.
- Si algún config no existe (`templates/ci/*.js` no presentes), saltar ese paso e informar.

## Paso 3 — Lente adversarial (red-team)

Prompt único dentro del mismo agente (no subagents paralelos):

> **"Eres reviewer escéptico. Tu único trabajo es encontrar las razones más sólidas por las que este cambio NO debería archivarse. Busca fallos que sean costosos, peligrosos o difíciles de detectar. No busques validar, rompe."**

Ejes a cubrir (lo que `/verify` NO cubre):
- **Seguridad ofensiva**: ¿cómo lo atacaría un adversario? (input sin sanitizar, credenciales en logs, bypass de auth).
- **Robustez ante fallos**: ¿qué pasa si la base de datos cae? Si el servicio externo retorna error? Si el input está vacío.
- **Tradeoffs**: ¿se consideraron alternativas? ¿por qué se eligió esta solución sobre otras? ¿es la idónea para el dominio de negocio?
- **SOLID contextual**: usar los outputs de eslint/dependency-cruiser de Step 2 como evidencia; no conteo manual de líneas.

**Auto-refutación estructurada (M-501)**: todo hallazgo de severidad `CRITICAL`
pasa por el protocolo de 4 pasos antes de aparecer en el veredicto final:

1. **Hipótesis de refutación**: ¿puede ser falso positivo? Formular qué debería
   ser cierto en el código/tests para que el hallazgo no lo sea.
2. **Búsqueda de evidencia contradictoria**: revisar código y tests buscando esa
   evidencia (no asumir; verificar).
3. **Decisión final**: mantener o descartar, siempre **con motivo** explícito.
4. **Registro**: conservar el par hallazgo original + refutación para el reporte.

- Solo los hallazgos que **sobreviven** al protocolo aparecen en el veredicto
  (Paso 5) y en el `summary`.
- Los hallazgos **descartados** no aparecen en el veredicto: se listan en el
  anexo "Descartados" del reporte (Paso 5) y alimentan el contador
  `findings.discarded` del JSON persistido (Paso 7).

## Paso 4 — Diff selectivo

- Para los archivos modificados, leer **solo los hunks** (`git diff -- <file>`), no el archivo entero. Aplicar el lente adversarial ahí.

## Paso 5 — Veredicto estructurado

Imprimir un bloque YAML compacto en pantalla (los mismos datos, en formato JSON versionado, se persisten en el Paso 7):

```yaml
verdict: SHIP | NO-SHIP
confidence: 0.0-1.0
findings:
  - severity: CRITICAL|WARNING|INFO
    category: security|robustness|solid|tradeoff|tests
    file: ruta:línea
    evidence: "..."
    recommendation: "..."
summary:
  total_findings: N
  critical: N
  warnings: N
  info: N
  discarded: N
```

- `summary.discarded` = hallazgos `CRITICAL` refutados por el protocolo del
  Paso 3. **No** se incluyen en `total_findings` ni en `critical`
  (invariante: `total_findings = critical + warnings + info`).

Mostrar al usuario solo `verdict` + `summary`; los detalles expandibles están disponibles si se solicita.

**Anexo "Descartados"** — para cada hallazgo `CRITICAL` refutado por el
protocolo del Paso 3, registrar en el reporte (fuera del veredicto):

```yaml
discarded_findings:
  - severity: CRITICAL
    category: security|robustness|solid|tradeoff|tests
    file: ruta:línea
    original_evidence: "hallazgo original tal como fue detectado"
    refutation: "evidencia contradictoria encontrada en código/tests"
    reason: "motivo explícito del descarte"
```

- Los hallazgos de este anexo **no** aparecen en el bloque del veredicto ni en
  `summary.total_findings`/`summary.critical`.
- El conteo del anexo debe coincidir con `summary.discarded` (bloque YAML) y
  con `findings.discarded` del JSON persistido (Paso 7).

## Paso 6 — Detección de cambios ya stageados por /archive (compatibilidad)

- Si `openspec/state/manifest.json` existe y lista archivos en `openspec/archive/`, **no vuelva a auditarlos**. Reportarlos como *"archivados anteriormente, sin nuevos hallazgos"* y enfocarse solo en código nuevo.

## Paso 7 — Persistencia del veredicto

Escribir `openspec/state/adversarial-result.json` al finalizar **cada** auditoría
— incluidos veredictos NO-SHIP. Prevalencia **last-write-wins**: cada corrida
**sobrescribe** el archivo anterior, así que el archivo siempre refleja la
**corrida más reciente** — el gate de `/commit` lee solo esa corrida (ver
`commit/SKILL.md`, Step 2). El esquema es versionado (`schema_version: 1`); el ejemplo canónico es
`ai-specs/examples/adversarial-results-example.json`, autovalidado por
`tests/adversarial-state-test.sh`:

```json
{
  "schema_version": 1,
  "change": "{change activo de openspec/changes/}",
  "ticket_id": "{TICKET-ID de proposal.md}",
  "verdict": "SHIP",
  "confidence": 0.9,
  "timestamp": "2026-09-05T15:00:00Z",
  "findings": {
    "total": 3,
    "critical": 0,
    "warnings": 2,
    "info": 1,
    "discarded": 2
  }
}
```

Reglas:

- Escribir vía redirección `cat > openspec/state/adversarial-result.json` (la
  evidencia es la **única** escritura permitida del reviewer; `edit` permanece
  denegado). Crear el directorio si falta con `mkdir -p openspec/state`.
- `total`/`critical`/`warnings`/`info` salen del `summary` del Paso 5;
  `discarded` del anexo "Descartados". Invariantes: `total = critical +
  warnings + info` y `critical ≤ total`.
- `timestamp` en ISO-8601 (ej. `2026-09-05T15:00:00Z`).
- El archivo queda trackeado en git (no gitignored): evidencia auditable en PRs.
- Si falla la escritura → advertir pero no abortar (el reporte en pantalla ya se
  emitió). El gate duro del veredicto vive en `/commit` (activo desde M-901),
  no en este archivo.

---
**Eliminado**: la Fase 7 (OpenSpec Alignment) ha sido removida (cubre `/verify`). Esta skill ahora se enfoca únicamente en auditoría adversarial: robustez, seguridad, tradeoffs y diseño contextual.