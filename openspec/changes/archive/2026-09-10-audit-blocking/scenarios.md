# Scenarios — Audit Blocking

> Trazabilidad: cada escenario corresponde a un acceptance criterion del enriched ticket C2.

### SC-201: Audit bloquea con vulns sin suppression

- Given una vulnerabilidad high o critical que NO está en `npm-audit-suppressions.json`
- When se ejecuta `npm run audit`
- Then el script retorna código distinto de 0
- And el mensaje incluye el ID de la vulnerabilidad y su severidad

### SC-202: Suppressions permiten excluir vulns conocidas

- Given una vulnerabilidad en `npm-audit-suppressions.json` con campo `reason` y sin `revokedAt`
- When se ejecuta `npm run audit`
- Then la vuln suprimida no causa fallo del pipeline
- And el script imprime un mensaje informativo indicando que la vuln fue suprimida

### SC-203: Suppressions expiran con revokedAt

- Given una suppression en `npm-audit-suppressions.json` con `revokedAt` en el pasado
- When se ejecuta `npm run audit`
- Then la suppression expirada NO se aplica
- And la vulnerabilidad causa fallo del pipeline

### SC-204: devDependencies tienen camino suave (Warning)

- Given una vulnerabilidad high que afecta SOLO a devDependencies (no a dependencies)
- When se ejecuta `npm run audit`
- Then el script emite un WARNING con la información de la vuln
- But no retorna código distinto de 0 (no falla)

### SC-205: critical siempre bloquea sin importar devDependencies

- Given una vulnerabilidad critical en devDependencies
- When se ejecuta `npm run audit`
- Then el script retorna código distinto de 0 (falla)
- And el mensaje indica que critical siempre bloquea

### SC-206: Makefile sigue funcionando (intocable)

- Given el Makefile sin modificar
- When se ejecuta `make ci`
- Then el target `audit` completa sin error (el `|| true` interno del Makefile sigue activo)

### SC-207: CI project-ci refleja el gate duro

- Given el job `project-ci` en `.github/workflows/ci.yml`
- When un PR contiene una vulnerabilidad high/critical sin suppression
- Then el job `project-ci` falla
- And el PR queda bloqueado para merge
