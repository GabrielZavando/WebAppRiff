# Skill: sync-specs

## Description

Synchronizes the active change's spec deltas (`openspec/changes/<change>/specs/`)
into the main specifications (`openspec/specs/`) **sin archivar el change**.
Designed for long-running changes, where the canonical specs would otherwise
stay stale until `/archive` runs at the end of the SDD cycle.

## Scope contract (read first)

- **Premisa de entorno**: existe como máximo un **único change activo**. Este
  skill no implementa selección entre múltiples changes ni acepta argumento
  `TICKET-ID`.
- Este skill **sin archivar** opera: no mueve el change a `openspec/archive/`,
  no ejecuta `openspec archive`, y **nunca toca
  `openspec/state/manifest.json`** (eso es exclusivo de `/archive`).
- **Token-light** (patrón `/archive`): nunca leer specs completas al contexto
  del LLM. Esta regla token-light es de diseño, no opcional. Los deltas
  se aplican con operaciones de archivo determinísticas y el reporte final es
  un **resumen cuantitativo** (conteos), nunca el contenido completo.

## Process

### Step 1 — Detectar el change activo

Listar `openspec/changes/` (solo nombres de directorio, vía `ls`). Si no existe
el directorio o está vacío:

- Reportar **"no hay change activo"** y terminar **sin modificar ningún
  archivo**.

Premisa: hay exactamente un change activo. No se contempla el caso de varios.

### Step 2 — Localizar los deltas (solo nombres)

Listar los archivos en `openspec/changes/<change>/specs/` con `ls` — solo
nombres, sin abrir su contenido completo. Si el directorio `specs/` no existe o
está vacío, reportar "sin diferencias" y terminar.

### Step 3 — Aplicar los deltas a `openspec/specs/`

Para cada delta, aplicar los encabezados estructurados de OpenSpec
(`## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`,
`## RENAMED Requirements`) sobre la spec correspondiente en `openspec/specs/`,
usando operaciones determinísticas de archivo (no lectura completa en
contexto):

- **Added**: añadir los requisitos nuevos con sus escenarios.
- **Modified**: reemplazar el requisito existente. **Regla del mantenedor:** si
  la spec destino no existe en `openspec/specs/`, tratar el delta `## MODIFIED`
  como `## ADDED`.
- **Removed**: eliminar el requisito indicado.
- **Renamed**: renombrar según `FROM:`/`TO:` del delta.

**Guard de seguridad**: si un delta usa encabezados no reconocidos fuera de esa
gramática, **abortar** el sync con un reporte explícito del delta problemático.
Está prohibida la aplicación parcial: ninguna spec queda a medio modificar.

**Idempotencia**: si los deltas ya están aplicados en `openspec/specs/` (el
contenido resultante no cambiaría), reportar **"sin diferencias"** y no
modificar archivos. Re-ejecutar `/sync-specs` tras un sync exitoso es siempre
un no-op seguro.

### Step 4 — Reporte cuantitativo

El reporte final es un resumen cuantitativo, nunca el contenido de las specs:

```
Sync completado:
  Specs tocadas:      <n>
  Requisitos añadidos:    <n>
  Requisitos modificados: <n>
  Requisitos eliminados:  <n>
  Requisitos renombrados: <n>
Change activo: <nombre> (NO archivado — manifest intacto)
```

Recordatorio opcional al usuario: los cambios ya aplicados en `openspec/specs/`
se consolidan formalmente en el manifiesto al ejecutar `/archive` al final del
ciclo.

## Failure protocol

Este skill opera sobre archivos, no implementación TDD; si una aplicación de
delta falla, detenerse en el primer fallo y reportar el delta exacto que no se
pudo aplicar (nombre de spec + encabezado), sin intentar corregir el contenido
del delta por cuenta propia.
