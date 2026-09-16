# TDD Failure Protocol — Fuente canónica

> **Rol de este documento**: es la **fuente única de verdad** del protocolo de
> fallo TDD del ciclo SDD. `.opencode/commands/apply.md`,
> `ai-specs/agents/build-agent.md` y `ai-specs/examples/tasks.md` **referencian**
> este documento; ninguno duplica sus pasos ni su plantilla. Editar aquí
> actualiza el protocolo para todo el flujo.

El protocolo se aplica cuando un test falla durante la implementación de una
tarea en `/apply`. **Extiende** el ciclo RED-GREEN-REFACTOR definido en
`ai-specs/agents/build-agent.md`; no lo reemplaza.

## Límite: 3 intentos consecutivos

1. **Detectar** — Un test que falla detiene el paso GREEN. Analizar el error
   antes de tocar código otra vez.
2. **Intentar** — Corregir el mínimo código necesario y re-ejecutar el test
   fallido. Cada re-ejecución fallida cuenta como un intento. Máximo **3
   intentos consecutivos** por tarea.
3. **Reportar** — Si el 3er intento consecutivo falla, generar un
   `TDD Failure Report` con los campos: `Task`, `Attempt`, `Error`,
   `Suggested investigation`.
4. **Detener** — Tras reportar, detenerse inmediatamente: **no** marcar la
   tarea como completada, **no** continuar con la siguiente tarea, y esperar
   una instrucción explícita del usuario.

Una instrucción explícita del usuario para reintentar reinicia el contador de
intentos, y el protocolo aplica de nuevo desde el paso 1.

## Plantilla del TDD Failure Report

Emitir el reporte verbatim con esta plantilla:

```
TDD Failure Report
Task: <task id and short description from tasks.md>
Attempt: <1 | 2 | 3>
Error: <condensed error summary — no full traceback>
Suggested investigation: <one concrete next step to diagnose the failure>
```
