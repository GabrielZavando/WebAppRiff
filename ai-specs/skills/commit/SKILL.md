# Skill: commit

## Description

Creates semantic commits following Conventional Commits and manages Pull Requests when finishing an OpenSpec change. This skill is **token-light**: uses `git diff --stat` and `git status --short` instead of reading the full diff, and groups changes by path patterns rather than analyzing content.

**Use after:** `/verify` con `status: PASS` y `/adversarial-review` con `verdict: SHIP` — sus evidencias persistidas en `openspec/state/` son **gates duros** de este skill (Step 2). Sin ambas evidencias vigentes para el change de referencia, el commit solo es posible con `--force` registrado.

**Reference:** For Conventional Commits format, allowed types, semver, and commitlint configuration, see `ai-specs/reference/commits.md`.

---

## Step 1 — Extraer contexto del cambio (token-light)

Obtener el cambio activo:

- `ls openspec/changes/` y tomar el único cambio presente. Si hay varios, listar nombres y pedir al usuario cuál commitear.
- Resolver el **change de referencia** para el gateway de evidencia: si hay change activo, es ese; si no lo hay (commit tras `/archive`), el **change recién archivado** — tomar la carpeta más reciente de `openspec/changes/archive/` y quitarle el prefijo de fecha `YYYY-MM-DD-` que añade el CLI (ej. `2026-09-05-enforce-commit-gates` → `enforce-commit-gates`).
- Leer el `TICKET-ID` y el `derived-name` desde `proposal.md` (header `Ticket ID:`). Si no existe, intentar leerlo de `openspec/tickets/{derived-name}-enriched.md` (solo el nombre de archivo, no su contenido).
- **No** leer `scenarios.md`, `requirements.md` ni `tasks.md` en su contenido completo.

---

## Step 2 — Gateway de evidencia (gates duros, M-901)

Desde M-401, `/verify` persiste `openspec/state/verify-results.json` tras cada
ejecución (Step 8 de su skill); desde M-502, `/adversarial-review` persiste
`openspec/state/adversarial-result.json` (Paso 7 de su skill). Este paso aplica
esas evidencias como **gates duros**: sin verify `PASS` y adversarial `SHIP`
vigentes para el change de referencia **no hay commit**. El skill no pregunta a ciegas:
usa la evidencia cuando es utilizable; cuando es negativa, ausente, inválida o
ajena, **bloquea y ofrece** ejecutar la herramienta faltante, abortar, o usar
`--force`.

**Flag `--force` (escape hatch de emergencia)**: con gates fallidos o sin
evidencia utilizable, solo el flag `--force` permite continuar, y el bypass
**queda registrado**: el mensaje de cada commit termina con el trailer git
`Gate-Bypass: --force (verify=<PASS|PARTIAL|FAIL|missing>; adversarial=<SHIP|NO-SHIP|missing>)` reflejando el estado real de ambos gates. Con gates verdes el trailer **no se emite**.

**Reglas comunes a ambos gateways** (lectura token-light; para extraer campos
puntuales: `node -e "const d=require('./openspec/state/verify-results.json');console.log(d.status)"`):

1. **Evidencia utilizable** = el archivo existe, es JSON válido y su campo
   `change` coincide con el change de referencia del Step 1 (el change activo o,
   tras `/archive`, el change recién archivado por su nombre derivado, tolerando
   el prefijo de fecha del CLI). Si no se puede resolver un change de referencia,
   ninguna evidencia es utilizable (el match falla por definición).
2. **Chequeo de staleness (warn-only, git-based)**: la evidencia es **stale**
   si existe al menos un commit posterior a su `timestamp` que toca alguna de
   estas **rutas de código**: `src/`, `app/`, `tests/`, `ai-specs/`, `.opencode/`.
   Los commits que solo tocan `docs/`, `openspec/` u otras rutas no-code
   **no ensucian** la evidencia. Si hay staleness, imprimir
   `⚠️ Evidencia posiblemente desactualizada: existe un commit de código posterior al timestamp de la evidencia ({timestamp}) — considera re-ejecutar la herramienta`
   y continuar — el staleness no bloquea por sí solo; lo que bloquea es la
   evidencia negativa o su ausencia.
3. La auditoría adversarial **deja de ser opcional** en `/commit`: sin veredicto
   utilizable no hay commit (salvo `--force` registrado).
4. **Prevalencia last-write-wins**: cada ejecución de `/verify` **sobrescribe**
   `openspec/state/verify-results.json` y cada ejecución de
   `/adversarial-review` **sobrescribe** `openspec/state/adversarial-result.json`;
   este gateway siempre lee la **corrida más reciente**. No hay historial: la
   corrida previa a una re-ejecución deja de existir como evidencia.

### 2a — Gateway de verify

- `status: "PASS"` → omitir la pregunta y reportar en una línea:
  `✅ Evidencia de verify: PASS ({timestamp})`. Continuar a 2b.
- `status: "PARTIAL"` o `"FAIL"` → imprimir
  `⛔ Gate duro de verify: {status} ({timestamp})` (si además
  `evidence_mode: "static"`, añadir: *evidencia débil — verificación estática,
  sin tests ejecutables*), **bloquea y ofrece**: (a) re-ejecutar `/verify` ahora
  (subproceso), (b) abortar, o (c) usar `--force`. **No continuar sin decisión
  explícita.**
- **Evidencia ausente, inválida o ajena** (el archivo no existe, es JSON
  inválido, o su campo `change` no coincide con el change de referencia) →
  **bloquea y ofrece**: (a) ejecutar `/verify` ahora, (b) abortar, o (c) usar
  `--force`. No existe la pregunta a ciegas previa a M-401: ya no se pregunta si
  se ejecutó verify. **No continuar sin decisión explícita.**

### 2b — Gateway adversarial

Tras el gateway de verify, aplicar la misma matriz sobre
`openspec/state/adversarial-result.json` (extracción token-light de `verdict` y
`timestamp`: `node -e "const d=require('./openspec/state/adversarial-result.json');console.log(d.verdict, d.timestamp)"`).

- `verdict: "SHIP"` → omitir la confirmación manual de la auditoría y reportar:
  `✅ Veredicto adversarial: SHIP ({timestamp})`. Continuar a Step 3.
- `verdict: "NO-SHIP"` → imprimir
  `⛔ Gate duro adversarial: NO-SHIP ({timestamp})`, **bloquea y ofrece**:
  (a) re-ejecutar `/adversarial-review` ahora (subproceso), (b) abortar, o
  (c) usar `--force`. **No continuar sin decisión explícita.**
- **Veredicto ausente, inválido o ajeno** → **bloquea y ofrece**: (a) ejecutar
  `/adversarial-review` ahora, (b) abortar, o (c) usar `--force`. La auditoría
  deja de ser opcional: la ausencia ya no mantiene el flujo de confirmación
  previo a M-502. **No continuar sin decisión explícita.**

Si el usuario eligió `--force`, guardar el estado real observado de ambos gates
(verify y adversarial, en ese orden) para el trailer `Gate-Bypass` que Step 6
añadirá a los mensajes de commit.

---

## Step 3 — Validación de rama (solo advertir)

- `git branch --show-current`.
- Si la rama actual **no** coincide con `feature/*` → imprimir advertencia:
  ```
  ⚠️ Rama actual '{branch}' no sigue la convención feature/.
  ¿Continuar de todos modos?
  ```
- **Preguntar al usuario**; **no abortar ciegamente** (el proyecto puede usar otra convención).

---

## Step 4 — Diff selectivo (prop. 3.7)

- `git status --short` y `git diff --stat` (stageados + no stageados). **Nunca** `git diff` completo.
- Detectar grupo ya stageado por `/archive`: archivos bajo `openspec/` → tratar como commit `chore(specs): archive {TICKET-ID} ({derived-name})` (reutilizar el mensaje sugerido por archive Step 6).
- Agrupación lógica por patrones de ruta:
  - `tests/` → `test(...)`
  - `src/`/`app/` → `feat|fix|refactor(...)` 
  - `docs/` → `docs(...)`
  - `package.json`/`pyproject.toml`/`*.config.*` → `chore|ci(...)`
- **No** "adivinanza" sobre contenido; agrupar por ruta.

---

## Step 5 — Plan de commits + confirmación (prop. 3.2)

Imprimir tabla con el plan propuesto:

```
  #  Archivos                                   Mensaje sugerido
  1  openspec/...                                chore(specs): archive PROJ-123 (auth-reset)
  2  tests/...                                   test(auth): add password reset tests
  3  src/...                                     feat(auth): implement password reset flow
```

Usar plantilla estructurada (Conventional Commits):

```
<tipo>(<ámbito>): <asunto en presente>

<cuerpo opcional — qué y por qué, no cómo>

<footer opcional: Closes #TICKET-ID, BREAKING CHANGE: ...>
```

- **Preguntar al usuario: "¿Aprobás este plan de commits?"**  **Antes** de cualquier `git add`/`git commit`.

---

## Step 6 — Ejecutar commits (solo tras aprobación)

Por cada grupo aprobado:

```
git add <archivos>
git commit -m "<mensaje Conventional Commit>"

Incluir `Closes #{TICKET-ID}` solo en el commit principal (no en todos).
```

- **Trailer `Gate-Bypass` (solo si Step 2 registró un bypass `--force`)**: el
  mensaje de cada commit de este skill termina con el trailer usando el estado
  real observado en Step 2, ej.
  `Gate-Bypass: --force (verify=PARTIAL; adversarial=missing)`. Con gates
  verdes el trailer **no se emite**.

  **Gramática formal (EBNF)** — el trailer es un contrato estable para
  tooling externo; el orden de los campos es fijo (`verify` antes de
  `adversarial`), el separador es exactamente `; ` y los enums son cerrados:

  ```
  gate-bypass       = "Gate-Bypass: --force (" verify-state "; " adversarial-state ")"
  verify-state      = "verify=" ("PASS" | "PARTIAL" | "FAIL" | "missing")
  adversarial-state = "adversarial=" ("SHIP" | "NO-SHIP" | "missing")
  ```

  **Regex canónica de parseo** (ancla de línea completa):

  ```
  ^Gate-Bypass: --force \(verify=(PASS|PARTIAL|FAIL|missing); adversarial=(SHIP|NO-SHIP|missing)\)$
  ```

Si el usuario no aprueba algún grupo → omitirlo y seguir con el resto.

---

## Step 7 — Push + PR (confirmación explícita, prop. 3.2/3.6)

- **No** ejecutar `git push` ni `gh pr create` sin confirmación del usuario.
- Pre-PR: `git fetch origin main` y verificar `git merge-base --is-ancestor origin/main HEAD` → si no, avisar:
  ```
  ⚠️ La rama no está actualizada con main
  ```
- `gh pr create` solo tras aprobación; usar `.github/pull_request_template.md` si existe; título conventional + cuerpo con referencia al change.
