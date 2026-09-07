# Mandatory Steps — Pasos obligatorios de implementación

> **Rol de este documento**: es la **fuente única de verdad** del checklist
> obligatorio de implementación del ciclo SDD. El skill `plan-change` **inyecta
> su contenido** como sección `## Mandatory Steps` en todo `tasks.md` generado,
> leyéndolo en el momento de generación, de modo que la checklist viaja dentro
> del artefacto que el agente `build` ejecuta. Editar aquí actualiza todo
> `tasks.md` generado después; no duplicar esta lista dentro de skills ni
> agentes.

Esta checklist es **obligatoria, no sugerida**. Aplica a toda tarea de
implementación ejecutada vía `/apply`, tanto en el propio framework Specboot
(dogfooding) como en cualquier proyecto consumidor.

## Pre-implementación

Antes de escribir la primera línea de la tarea actual:

- [ ] La **rama activa** sigue la convención vigente del proyecto (ej.
  `feature/*`, `fix/*`); trabajar sobre ella, nunca directamente sobre la rama
  principal.
- [ ] Estado **git limpio**: sin cambios sin commitear (ni staged) antes de
  empezar; si hay trabajo en curso, resolverlo primero.

## Durante la implementación

- [ ] **Test nuevo que falla antes de implementar (RED)**: escribir el test del
  escenario (`SC-NNN`) y verificar que falla antes de escribir código de
  producción.
- [ ] Ejecutar los **tests unitarios del módulo** tocado mientras se itera
  (ciclo RED-GREEN-REFACTOR), no solo al final.

## Post-implementación

Antes de dar la tarea por cerrada:

- [ ] **Ejecutar `verify`**: la verificación del change corre y produce
  evidencia persistente (`openspec/state/verify-results.json`).
- [ ] **Ejecutar `adversarial-review`**: la auditoría adversarial corre y
  produce veredicto persistente (`openspec/state/adversarial-result.json`).

> Ambos pasos post alimentan los gates duros de `/commit` (M-901): sin
> `PASS` + `SHIP` vigentes para el change activo, el commit bloquea.
