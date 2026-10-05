# Riff Catálogo Digital — Agent Instructions

> Instrucciones de contexto para agentes IA (OpenCode).
> Este archivo es **del proyecto**: el flujo SDD lo ejecuta la CLI
> [OpenSpec](https://github.com/Fission-AI/OpenSpec) v1.14.0 (Fission-AI) vía
> las skills instaladas en `.opencode/skills/`.

## 1. Carga base (siempre)

- `AGENTS.md` — este archivo (contexto del proyecto y flujo SDD).
- `docs/base-standards.md` — principios globales (SDD / TDD / SOLID,
  conventional commits, idiomas). Cargado automáticamente vía
  `opencode.json` → `instructions[]`.

## 2. Contexto del proyecto

El contexto de negocio y stack vive en `docs/project/` (fuente de verdad):

- `docs/project/domain.md` — dominio: catálogo digital headless de Riff
  (productos, categorías, subcategorías, usuarios, cotizaciones).
- `docs/project/stack.md` — stack: NestJS (BFF) + Astro (sitio SSG) + Angular
  (admin), Firestore, Cloud Run + Coolify.
- `docs/project/client.md` — cliente / audiencia.

Estándares por área (cargar según la tarea, no "por si acaso"):

| Área | Archivos |
| --- | --- |
| Backend | `docs/backend-standards.md` |
| Frontend | `docs/frontend-standards.md` |
| API | `docs/api/api-spec.yml` + `docs/backend-standards.md` |
| Deploy | `docs/deploy-standards.md` |
| Docs | `docs/documentation-standards.md` |

## 3. Flujo SDD (OpenSpec)

Ciclo completo vía skills de OpenSpec en `.opencode/skills/`:

| Skill / comando | Uso |
| --- | --- |
| `/opsx-propose "idea"` | Proponer un change (proposal.md, design.md, tasks.md, specs/) |
| `/opsx-apply` | Implementar tasks con TDD |
| `/opsx-archive` | Archivar el change al completarlo (merge de specs delta) |
| `/opsx-explore` | Explorar / clarificar antes de proponer |
| `/opsx-sync` | Sincronizar specs del change activo sin archivar |

Reglas del flujo:

1. **Un change a la vez**: nunca saltarse pasos.
2. **TDD**: escribir el test fallido primero; nunca código de producción sin un
   test fallido existente.
3. **Artefactos antes que código**: si un fix aparece tras `/opsx-apply` y antes
   de `/opsx-archive`, actualizar primero los artefactos OpenSpec y luego el
   código. Nunca fixes directos sin actualizar specs.
4. **Idiomas**: artefactos OpenSpec y docs de negocio en **español**; código en
   **inglés**; commits en **inglés** (Conventional Commits).
5. **Tipado completo**: TypeScript strict, sin `any` sin justificación explícita.
6. Si algo es ambiguo en las specs, preguntar antes de asumir.

## 4. Herramientas de validación

- `npx openspec validate --all --strict` — valida specs y changes.
- `make ci` — gate de CI del proyecto: `openspec-validate` + lint + typecheck +
  test + audit.
- `make lint` / `make test` / `make audit` — targets por workspace (delegan en
  npm workspaces).
- husky + commitlint — conventional commits en `git commit`.

### Formato de supresiones de audit (`npm-audit-suppressions.json`)

Cada entrada usa el formato `{ id, reason, revokedAt?, review_by? }`. Las fechas
son ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ssZ`).

- `revokedAt` — revocación manual explícita. Si está en el pasado, la supresión
  deja de aplicarse y la vulnerabilidad vuelve a bloquear el gate.
- `review_by` — fecha de revisión trimestral. Si está en el pasado, la supresión
  caduca automáticamente y la vulnerabilidad vuelve a bloquear el gate.
- Ambos campos son independientes y acumulativos: la supresión es activa solo si
  ninguna de las dos fechas está en el pasado. Una supresión sin `review_by` no
  caduca por esta vía (compatibilidad con el formato previo).
- **Fail-loud**: si `revokedAt` o `review_by` contiene un valor no parseable
  como fecha válida, `npm run audit` falla con mensaje explícito (id de la
  supresión + valor inválido) en lugar de tratar la supresión como activa.

## 5. No negociable

1. Una tarea a la vez. Nunca saltar pasos.
2. Escribir el test fallido primero (TDD).
3. Código completamente tipado.
4. Especificaciones antes que código: si un cambio aparece post-apply, actualizar
   OpenSpec primero.
5. Ante ambigüedad, preguntar.
6. Los artefactos OpenSpec son la fuente de verdad del comportamiento.