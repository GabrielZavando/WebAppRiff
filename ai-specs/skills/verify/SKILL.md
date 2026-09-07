# Skill: verify

## Description

Executes tests and verifies the active OpenSpec change works. Uses selective context loading via Suggested Path/Test Path metadata from tasks, runs pytest/npm test runners when available, emits a compact YAML summary, and persists the results to `openspec/state/verify-results.json` after every run. Read-only over code and specs — the only file it writes is the verification evidence under `openspec/state/`.

## Step 1 — Identificar cambio activo

Listar `openspec/changes/` y tomar el único cambio activo. Si hay varios, pedir al usuario cuál. Si hay 0, error.

## Step 2 — Trazabilidad de artefactos

Validar cadena Requisito ↔ Escenario ↔ Tarea antes de tocar código:

- Cada requisito en `requirements.md` debe tener ≥1 escenario en `scenarios.md`.
- Cada escenario debe tener ≥1 tarea en `tasks.md` que lo cubra.
- Ejecutar `openspec validate {change}` como validación de esquema de carpeta.
- Falla temprano con error claro si la cadena está rota; detener proceso antes de verificar código.

## Step 3 — Contexto selectivo via `Suggested Path`

Leer **solo** los archivos listados en cada tarea bajo los campos `Suggested Path` (implementación) y `Test Path` (tests). Si un `Suggested Path` no existe → marcar tarea como `❌ Archivo no implementado` y pasar a la siguiente.

## Step 4 — Detección de stack (stack-agnóstico)

- Buscar `package.json` → stack Node: `npm test` / `npx vitest` / `npx jest` según scripts definidos.
- Buscar `pyproject.toml` o `requirements.txt` → stack Python: `pytest` con scripts del proyecto.
- Si no hay indicador de stack → advertir "stack no detectado" y proceder a verificación estática ligera solo con `Suggested Path`.

## Step 5 — Verificación ejecutable reforzada

### 5a — Localizar tests del change

- Por convención: `tests/**/*{change-name}*`, `tests/**/*.spec.*`, `tests/**/*.test.*`.
- Por referencia en `Test Path` de las tareas (campo añadido por `plan-change`).
- Si se encuentran → proceder a la 5b. Si no → marcar como `⚠️ Sin evidencia ejecutable` y pasar al fallback estático (Step 5e).

### 5b — Ejecutar test runner

- Detectar automáticamente el runner (`pytest`, `npm test`, `npx vitest`, `npx jest`).
- Ejecutar con banderas de salida corta:
  - `pytest {changed-path} -v --tb=short -q` (Python)
  - `npm test -- --testPathPattern="{changed-path}" --tb=short -q` (Node)
  - `npx vitest run {changed-path} --reporter=dot` (Node)
  - `npx jest --testPathPattern="{changed-path}" --tb=short -q` (Node)
- Parsear resultado: PASS → ✅; FAIL → ❌ con resumen resumido del traceback (no el trace completo).

### 5c — Cobertura de escenarios por tests (prioridad de evidencia)

Para cada escenario Gherkin en `scenarios.md` (identificado con su ID `SC-{NNN}`),
clasificar la evidencia de test en orden de prioridad:

1. **Evidencia fuerte — match por nombre/identificador**: el nombre del test contiene
   el ID (`[SC-001]` en el título para JS/TS, `test_sc001_` en el identificador para
   Python; convención definida en `ai-specs/agents/build-agent.md`). El resultado del
   test mapea directo: PASS → ✅, FAIL → ❌.
2. **Evidencia débil — mención textual**: el ID solo aparece en comentarios,
   descripciones o el cuerpo del test (no en el nombre). Marcar con ⚠️ "evidencia
   débil" en el reporte y **nunca** contarla como PASS. Si ese test falló → exponer
   ❌ FAIL (un fallo es señal honesta, sin otorgar cobertura).
3. **Sin evidencia**: el escenario no tiene ninguna referencia → `UNTESTED` (en el
   JSON del Step 8: `"test": "untested"`, `"status": "UNTESTED"`).

Reglas:

- El reporte debe mostrar la trazabilidad explícita `SC-{NNN} → test →
  PASS/FAIL/UNTESTED` (columna `evidence` del informe del Step 7 y array
  `scenarios[]` de `verify-results.json`).
- Una mención textual **jamás** produce PASS, aunque el test pase: sin match por
  nombre no hay evidencia fuerte de cobertura. La corrección correcta es renombrar
  el test con la convención (build-agent.md), no aceptar la coincidencia textual.
- Escenario con evidencia débil → ⚠️ explícito en el reporte final, pero **no** ✅.

### 5d — Smoke check de integración (opcional)

- Si el change declara endpoints nuevos o configuración de API en `docs/api/api-spec.yml`, y el proyecto tiene scripts de e2e/tests de integración (`tests/e2e`, `*.e2e-spec.*`), ejecutarlos.
- **Condición**: el change debe declarar explícitamente el endpoint objetivo y el proyecto debe tener un script de arranque (`npm run start:dev`, `uvicorn ...`, etc.) y un script de test de smoke en `package.json`.
- Si la infraestructura no existe (no hay scripts e2e, no hay proyecto levantable), **omitir** y no reportar error. Esto es opt-in por declaración.

### 5e — Fallback estático (cuando NO hay tests)

- Verificar cada tarea leyendo solo `Suggested Path`:
  - Archivo existe ✅
  - Archivo contiene referencias a entidades/endpoints mencionados en los escenarios ✅
  - Si falta archivo → ❌; si archivo vacío/sin referencias → ⚠️.
- Marcar explícitamente en el reporte: `status: PARTIAL` + nota "verificado solo estáticamente, evidencia débil".
- **Nunca** marcar como ✅ en este camino.

## Step 6 — Delta incremental

- `git diff --name-only $(git merge-base HEAD main)...HEAD` (fallback: `git status --porcelain`).
- Tareas cuyos archivos no aparecen en el diff y ya fueron verificadas en ejecuciones previas → "✅ sin cambios".
- Demás tareas → verificar completa (Step 5).
- **Nota**: esta mejora usa git y no requiere estado persistido para el delta incremental; la evidencia de verificación se persiste aparte en el Step 8.

## Step 7 — Informe en pantalla estructurado

Imprimir un bloque YAML compacto en pantalla (los mismos datos, en formato JSON versionado, se persisten en el Step 8):

```yaml
change: {name}
status: PASS|PARTIAL|FAIL
summary:
  total_tasks: N
  completed: N
  failed: N
  untested: N
scenarios:
  - id: SC-001
    status: PASS
    evidence: "test_sc001_password_reset"
details:
  - task: "2.1 Create PasswordResetRepository"
    status: PASS
    file: src/infrastructure/repositories/password_reset_repository.py
    evidence: "Class implements IRepository interface"
  - task: "3.3 Handle invalid email"
    status: FAIL
    file: src/application/handlers/reset_handler.py
    error: "Missing try-except block for UserNotFound"
```

Encima del bloque YAML: 3 líneas de resumen plano:

- `status: PASS` | `failed: 2` | `untested: 1`
- Lista plana de FAILs: `- ❌ Task 3.3 — src/.../reset_handler.py: Missing try-except`

Nada de narrativa larga, párrafos explicativos o metadata de debugging.

## Step 8 — Persistencia de resultados

Después de **cada** ejecución (incluyendo PASS, PARTIAL y FAIL), escribir
`openspec/state/verify-results.json` (crear el directorio con `mkdir -p` si falta).
El archivo queda **trackeado en git** (no gitignore). Prevalencia
**last-write-wins**: cada ejecución **sobrescribe** el archivo anterior, así que el
documento siempre refleja la **corrida más reciente** — el gate de `/commit` lee
solo esa corrida (ver `commit/SKILL.md`, Step 2). El esquema es versionado (`schema_version: 1`); el ejemplo
canónico vive en `ai-specs/examples/verify-results-example.json` y su contrato se
autovalida con `bash tests/verify-state-test.sh`.

```json
{
  "schema_version": 1,
  "change": "{name}",
  "ticket_id": "{TICKET-ID}",
  "status": "PASS | PARTIAL | FAIL",
  "evidence_mode": "executable | static",
  "timestamp": "{ISO-8601, ej. 2026-09-04T14:30:00Z}",
  "tasks": { "total": 5, "passed": 5, "failed": 0, "untested": 0 },
  "scenarios": [
    { "id": "SC-001", "test": "[SC-001] user password reset with valid email", "status": "PASS" }
  ]
}
```

Reglas:

- `ticket_id` se toma del header `Ticket ID:` de `proposal.md` (misma fuente que `archive`).
- Los enums son los mismos del informe en pantalla: `PASS|PARTIAL|FAIL` (global) y
  `PASS|FAIL|UNTESTED` (por escenario). `tasks.total` debe ser igual a
  `passed + failed + untested`.
- `evidence_mode: static` cuando la verificación provenga del fallback estático
  (Step 5e) → el status global **debe** ser `PARTIAL` y ningún escenario **debe**
  figurar como `PASS` (invariante REQ-003, validada por el self-test).
- `scenarios[].test` registra el nombre del test que provee la evidencia (mapeo del
  Step 5c). Si ningún test cubre el escenario → `"test": "untested"` y
  `"status": "UNTESTED"` (el campo no admite string vacío).
- Si la escritura del archivo falla → advertir pero **no abortar**: el informe en
  pantalla (Step 7) ya fue emitido y la verificación en sí ya se completó.

Consumidores de este archivo (no lo re-ejecutan):

- `/commit` lo lee como **gate duro** (Step 2 de su skill): `PASS` vigente para el
  change activo omite la pregunta; `PARTIAL|FAIL`, ausente, inválido o de otro
  change bloquea y ofrece re-ejecutar `/verify`, abortar o usar `--force`
  (bypass registrado como trailer `Gate-Bypass`).
- `archive` copia `{status, timestamp, source}` al manifiesto (Step 5 de su skill).

## Stack Notes

- Sin asumir `pytest` ni `jest` a priori.
- El stack se detecta por archivos de configuración reales en el repositorio.
- Si el proyecto tiene scripts de test personalizados, `plan-change` puede añadir `Test Path` personalizado; verify debe usarlos.