# Skill: archive

## Description

Closes the SDD cycle by archiving a completed OpenSpec change, updating the main specifications, and preparing the commit for `/commit`. This skill is token-light: it never reads `scenarios.md`, `requirements.md` or `tasks.md` in full, only parsing checkboxes and listing filenames.

## Step 1 — Identificar el change activo

Listar `openspec/changes/` y tomar el único cambio presente. Si hay varios, listar sus nombres y pedir al usuario que indique cuál archivar. Si hay 0, abortar con mensaje *"No hay cambios activos para archivar"*.

## Step 2 — Pre-checks ligeros (sin leer contenido completo)

- Ejecutar `git status --porcelain openspec/` y registrar si hay archivos modificados o untracked distintos de `openspec/changes/` y `openspec/state/`. Si los hay, imprimir *"⚠️ Hay cambios sin commitear en openspec/: [lista]"* (advertir, no abortar).
- Parsear `tasks.md` en busca de checkboxes abiertos (`- [ ]`). **Sólo** contar líneas con `- [ ]` (no escanee el archivo completo). Si quedan pendientes → abortar con *"❌ El cambio tiene tareas pendientes en tasks.md. Complete `/apply` o ejecute los pending tasks antes de archivar."*.
- Detectar el `TICKET-ID` leyendo el header `Ticket ID:` de `proposal.md`. Si no existe, intentar leerlo de `openspec/tickets/{derived-name}-enriched.md` (solo el nombre de archivo, no su contenido).

## Step 3 — Preview (solo nombres, sin contenido)

- Listar los archivos en `openspec/changes/{name}/specs/` con `ls` — solo nombres, no abrirlos.
- Ejecutar `git diff --stat main...HEAD -- openspec/specs/` para mostrar qué specs principales se verán fusionadas.
- **Resumen para el usuario**:
  ```
  Specs que se actualizarán: [auth-spec.md, user-spec.md]
  Tareas pendientes: 0
  Cambios sin commitear en openspec/: [lista vacía o nombres]
  ```
- Preguntar al usuario: *"¿Confirmas archivar este cambio y actualizar los specs principales?"*. Si el usuario no confirma → abortar limpiamente.

## Step 4 — Ejecutar `openspec archive`

- Ejecutar: `openspec archive {name} --yes` (usa el flag --yes para evitar prompts de confirmación, ya decidimos en Step 3).
- Si la CLI devuelve error → abortar y mostrar el error tal cual.
- Si `--skip-specs` es necesario (change tooling/docs), el skill debe detectarlo leyendo el header `Change type:` de `proposal.md` y omitir la fusión de specs si corresponde.

## Step 5 — Generar manifiesto JSON

- Crear/actualizar `openspec/state/manifest.json`.
- Si el archivo no existe, inicializarlo como `{"changes": []}`.
- **Evidencia de verificación (M-401)**: antes de construir la entrada, comprobar
  si existe `openspec/state/verify-results.json` para el change activo. Si existe,
  extraer **solo** `status` y `timestamp` (lectura token-light: dos campos puntuales,
  **nunca** el array `scenarios` — ej. `node -e "const d=require('./openspec/state/verify-results.json');console.log(d.status, d.timestamp)"`). Si no existe, continuar
  sin error ni bloqueo (el campo simplemente se omite).
- **Veredicto adversarial (M-502)**: comprobar también si existe
  `openspec/state/adversarial-result.json`. Si existe, verificar que su campo
  `change` coincida con el change activo y extraer **solo** `verdict` y
  `timestamp` (lectura token-light, **nunca** el detalle de hallazgos — ej.
  `node -e "const d=require('./openspec/state/adversarial-result.json');console.log(d.verdict, d.timestamp)"`). Si falta, es JSON inválido o corresponde
  a otro change → imprimir *"⚠️ Sin veredicto adversarial vigente para este
  change. Considera ejecutar `/adversarial-review` antes de archivar."* y
  continuar (el archive **nunca se bloquea** por falta de evidencia adversarial;
  el gate duro activo de `/commit` exige veredicto `SHIP` vigente).
- Añadir una entrada al array `changes`:
  ```json
  {
    "change_name": "{derived-name}",
    "ticket_id": "{TICKET-ID from proposal.md}",
    "archived_at": "{ISO-8601 timestamp}",
    "specs_applied": ["lista de specs fusionadas"],
    "verification": {
      "status": "{PASS|PARTIAL|FAIL — solo si verify-results.json existe}",
      "timestamp": "{timestamp del verify-results.json}",
      "source": "openspec/state/verify-results.json"
    },
    "adversarial": {
      "verdict": "{SHIP|NO-SHIP — solo si adversarial-result.json existe y change coincide}",
      "timestamp": "{timestamp del adversarial-result.json}",
      "source": "openspec/state/adversarial-result.json"
    }
  }
  ```
  Los campos `verification` y `adversarial` son **opcionales**: se incluyen solo
  cuando su archivo de evidencia existe y es JSON válido (en el caso de
  `adversarial`, además con el campo `change` coincidente); si falta alguno, la
  entrada del manifest se genera sin él (el archive nunca se bloquea por falta
  de evidencia).
- `archived_at` usar formato ISO-8601 (ej. `2026-08-25T14:30:00Z`). Si falla la escritura → advertir pero no abortar (el archive ya se completó).

## Step 6 — Preparar commit (no ejecutar)

- Ejecutar `git add openspec/` para stagear:
  - Los archivos nuevos/archivados en `openspec/archive/`.
  - El `manifest.json` actualizado.
  - Cualquier otro archivo de spec modificado por `openspec archive`.
- **No** ejecutar `git commit`. El commit se deja staged para que `/commit` lo ejecute en el siguiente paso del ciclo.

- Imprimir bloque con mensaje sugerido:
  ```
  chore(specs): archive change PROJ-123 (auth-reset)

  - Specs updated: auth-spec.md, user-spec.md
  - Archived to: openspec/archive/2026-08-25-auth-reset/
  ```
- **Nota**: `/commit` será quien ejecute `git commit -m "..."` en el siguiente paso.

## Step 7 — Limpieza

- Eliminar `openspec/tickets/{TICKET-ID}-enriched.md` si existe (el ciclo del ticket enriquecido terminó).
- **No** tocar archivos dentro de `openspec/archive/` (son histórico).
- Reporte final en YAML compacto (solo pantalla, no persistido):
  ```yaml
  change: auth-reset
  ticket_id: PROJ-123
  status: staged (commit pending)
  specs_applied:
    - auth-spec.md
    - user-spec.md
  ```