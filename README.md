# Zavando Specboot

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![OpenCode](https://img.shields.io/badge/OpenCode-ready-5B48E5)
![OpenSpec](https://img.shields.io/badge/OpenSpec-new%20change-22C55E)
![Status](https://img.shields.io/badge/Status-Template_SDD-0EA5E9)

Template boilerplate for **Spec-Driven Development (SDD)** using **OpenCode** + **OpenSpec**.

## ¿Qué es?

Repositorio de **configuración y estándares** para que los agentes IA tengan contexto antes de escribir código. **No contiene código de aplicación.**

Incluye:
- Estándares de backend, frontend y documentación
- Definiciones de agentes IA (backend-developer, frontend-developer, build)
- Skills reutilizables (enriquecer stories, commits, auditing, deploy, onboarding)
- Comandos personalizados para el ciclo SDD completo
- Contrato OpenAPI y modelo de datos

## Quick Start

```bash
# 1. Copia el template a tu proyecto
git clone https://github.com/GabrielZavando/Specboot.git mi-proyecto
cd mi-proyecto

# 2. Ejecuta setup
bash specboot.sh --init

# 3. Inicializa OpenSpec
openspec init

# 4. Personaliza (OBLIGATORIO)
#    - Edita docs/base-standards.md (sección 8)
#    - Edita docs/backend-standards.md y docs/frontend-standards.md
#    - Edita docs/api-spec.yml con tus endpoints
#    - Edita docs/data-model.md con tus entidades

# 5. Verifica personalización
bash specboot.sh --init

# 6. Abre con OpenCode
opencode

# 7. Ejecuta tu primer ciclo SDD
/enrich-us TICKET-ID   # (opcional) si el ticket es vago
/plan-change TICKET-ID # genera specs
/apply TICKET-ID       # implementa (TDD)
/verify TICKET-ID      # valida contra escenarios
/archive TICKET-ID     # archiva el cambio
/commit                # commits + PR
```

## Estructura del Proyecto

```
.
├── docs/                          # 📋 ESTÁNDARES — editar para contexto
│   ├── base-standards.md          #   Reglas globales + contexto proyecto
│   ├── backend-standards.md       #   Stack backend
│   ├── frontend-standards.md      #   Stack frontend
│   ├── documentation-standards.md #   Cómo documentar
│   ├── api-spec.yml               #   Contrato OpenAPI
│   └── data-model.md              #   Entidades del dominio
│
├── ai-specs/                      # ⚙️ NO EDITAR — configuración IA
│   ├── README.md                  #   Índice central de agents y skills
│   ├── agents/                    #   Roles del agente IA
│   ├── skills/                    #   Flujos reutilizables
│   └── examples/                  #   Ejemplos OpenSpec
│
├── templates/ci/                  # CI configs de referencia (Ticket 4)
│   ├── eslintrc.backend.js         #   ESLint NestJS: max-lines 300, complexity 10
│   ├── eslintrc.frontend.js        #   ESLint Angular: max-lines 400
│   ├── eslintrc.astro.js           #   ESLint Astro: max-lines warn
│   └── .dependency-cruiser.js      #   DIP mecánico (domain|application → no infra/ORM/HTTP)
│
├── .github/workflows/             # CI/CD
│   ├── ci.yml                     #   Invoca make lint/test/build/audit/solid-lint/commitlint
│   └── deploy.yml                 #   Deploy a staging/production
│
├── AGENTS.md                      # NO EDITAR — instrucciones OpenCode
├── opencode.json                  # ⚙️ EDITAR (modelo opcional)
├── Makefile                       # CI stack-agnostic: make install/lint/test/build/audit/commitlint
├── specboot.sh                    # Setup + validación SDD (--init / --ci)
├── check-refs.sh                  # Validación de integridad referencial ({file:...})
├── update.sh                      # Sync tooling a proyectos y bump de versión
├── CHANGELOG.md                   # Historial de versiones (Keep a Changelog)
├── tests/                         # Tests del template
│   ├── check-refs-test.sh          #   Integridad referencial {file:...}
│   ├── update-test.sh              #   sync tool (update.sh)
│   └── solid-templates-test.sh     #   meta-validación CI templates SOLID (Ticket 4)
├── .env.example                   # Template de variables entorno
├── .commitlintrc.json             # Conventional commits enforced
└── README.md                      # Este archivo
```

## Archivos que DEBES editar

| Archivo | Qué editar |
|---------|-----------|
| `docs/base-standards.md` | Sección 8: stack, arquitectura, dominio, cliente |
| `docs/backend-standards.md` | Stack: runtime, framework, ORM, DB, tests |
| `docs/frontend-standards.md` | Stack: framework, CSS, build, tests |
| `docs/deploy-standards.md` | Flujo de despliegue: entornos, versionado, Docker, rollback |
| `docs/api-spec.yml` | Endpoints reales de tu API |
| `docs/data-model.md` | Entidades reales del dominio |
| `opencode.json` | Opcional: añade `model` para fijar un proveedor distinto |

## Flujo SDD — Comandos

| Comando | Descripción |
|---------|-------------|
| `/enrich-us TICKET-ID` | Refinar ticket vago con criterios Gherkin |
| `/plan-change TICKET-ID` | Generar specs (escenarios, requirements, tasks) |
| `/apply TICKET-ID` | Implementar primera tarea con TDD |
| `/verify TICKET-ID` | Validar código contra escenarios |
| `/adversarial-review` | Auditoría 8 fases (incluye lente Architect/SOLID por stack) |
| `/archive TICKET-ID` | Archivar el cambio |
| `/commit` | Commits convencionales + Pull Request |
| `/deploy` | Release: version bump, build, deploy a staging/producción, smoke tests, rollback |

## Workflow Visual

```
/enrich-us (opcional)
       ↓
/plan-change → genera .openspec/<ticket>/
       ↓
/apply → implementa tasks (1 por vez, TDD)
       ↓
/verify → valida escenarios
       ↓
/adversarial-review (opcional)
/archive → cierra el cambio
       ↓
/commit → commits + PR
```

## Skills Disponibles

| Skill | Uso |
|-------|-----|
| `enrich-us` | `/enrich-us` antes de planificar |
| `commit` | `/commit` al final del ciclo |
| `code-auditing` | `/adversarial-review` antes de archivar (incluye lente Architect/SOLID por stack) |
| `using-git-worktrees` | Workspaces aislados por feature |
| `deploy` | Release, version bump, Docker, rollback |
| `onboarding` | Setup para nuevos desarrolladores |

Ver `ai-specs/README.md` para índice completo.

## Personalización Avanzada

### Modelo de IA (agnóstico)

Este template **no fija ningún modelo** en `opencode.json`. OpenCode usa el
modelo que tengas seleccionado en el momento de trabajar (el modelo activo de tu
proveedor/sesión), así el sistema es agnóstico al modelo de IA.

```json
// opencode.json — sin campo "model": OpenCode usa el modelo activo
{
  "agent": {
    "plan":     { "mode": "primary" },
    "build":    { "mode": "primary" },
    "reviewer": { "mode": "subagent" }
  }
}
```

Si quieres fijar un default de proyecto, añade `"model"` a nivel superior; y si
un agente necesita un modelo distinto, añade `"model"` solo en ese agente (los
demás heredan el modelo global). No dupliques el valor: basta un único punto de
configuración.

### Agregar nuevo skill

1. Crear `ai-specs/skills/mi-skill/SKILL.md`
2. Agregar a `AGENTS.md` → Available skills

### Configurar MCP servers

```json
// opencode.json
{
  "mcp": {
    "postgres": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-postgres", "--connection-string", "postgresql://..."]
    }
  }
}
```

### Permisos de bash personalizados

```json
// opencode.json
{
  "permission": {
    "bash": {
      "docker *": "allow",
      "rm -rf *": "ask",
      "*": "deny"
    }
  }
}
```

## CI/CD Incluido

- **`.github/workflows/ci.yml`**: Invoca los targets del `Makefile` (`make lint`, `make test`, `make build`, `make audit`, `make commitlint`). Cada stack implementa esos targets; `ci.yml` solo los invoca.
- **`.github/workflows/deploy.yml`**: Docker build, deploy a staging/producción, smoke tests, rollback
- **`.commitlintrc.json`**: Conventional Commits enforced

## Requisitos

| Herramienta | Versión mínima |
|-------------|---------------|
| Node.js | 20.19.0 |
| OpenCode | última |
| OpenSpec CLI | última |

```bash
npm install -g @fission-ai/openspec@latest
```

## Validación

Ejecuta `bash specboot.sh --ci` para validar la configuración en modo CI (sin efectos secundarios), o `bash specboot.sh --init` para verificar la estructura del proyecto:

```bash
# Validación estricta para CI (exit 1 si hay errores)
bash specboot.sh --ci

# Integridad referencial: {file:...} en opencode.json y SKILL.md
bash check-refs.sh

# Setup local: verifica estructura del proyecto
bash specboot.sh --init

# Ayuda
bash specboot.sh --help
```

✅ Valida estructura de archivos (lista única compartida entre --init y --ci)
✅ Verifica que el proyecto es OpenCode-only (sin symlinks de .claude/.cursor)
✅ Detecta placeholders sin reemplazar
✅ Valida JSON de opencode.json
✅ Verifica skills y ejemplos
✅ Verifica integridad referencial de {file:...} (check-refs.sh)

## Versionado y actualización

Specboot se versiona con **semver vía git tags** (ej. `v0.1.0`, `v0.2.0`). El historial
de cambios vive en `CHANGELOG.md` (formato Keep a Changelog).

- **Actualizar un proyecto ya creado** (sin tocar `docs/` personalizado):
  ```bash
  bash update.sh --template /ruta/a/nuevo/specboot
  ```
  Sincroniza `ai-specs/`, `AGENTS.md`, `specboot.sh`, `check-refs.sh`, `Makefile`
  y `templates/` (configs de CI SOLID/POO del Ticket 4).
  Usa `--dry-run` para previsualizar.

- **Cortar un release** (mantenedores):
  ```bash
  bash update.sh --bump minor   # crea tag vX.Y.Z y entrada en CHANGELOG.md
  git push origin vX.Y.Z
  ```

## FAQ

**¿Necesito OpenSpec?** Sí. Sin él, `/plan-change`, `/apply`, `/verify` y `/archive` no funcionan.

**¿Puedo fijar un modelo?** Sí (opcional). Añade `"model"` a nivel superior en `opencode.json` si quieres usar un proveedor distinto al de tu sesión activa; si lo omites, OpenCode usa el modelo activo.

**¿Es solo OpenCode?** Sí. Este template es **OpenCode-only**: los agentes y skills viven en `ai-specs/` y se consumen vía `{file:...}` en `opencode.json`. No se crean symlinks ni configuraciones para Claude Code (`.claude/`) ni Cursor (`.cursor/`). Ver `docs/base-standards.md` §6.

**¿Puedo usar esto con proyecto existente?** Sí. Copia el template y ejecuta los pasos de personalización.

**¿Funciona en Windows?** Sí. `specboot.sh --ci`/`--init` validan la estructura y la integridad referencial sin crear symlinks (el template es OpenCode-only). `opencode.json` y los agentes/skills en `ai-specs/` se leen directamente, así que no hay requisito de symlinks ni de Developer Mode.

---

## 📄 Licencia

MIT © 2026 [Gabriel Zavando](https://gabrielzavando.cl)

Basado en [lidr-specboot](https://github.com/LIDR-academy/lidr-specboot).