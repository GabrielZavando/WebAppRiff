#!/bin/bash
# specboot.sh — Combined setup & validation for Zavando Specboot (SDD template)
#
# Replaces the former setup.sh and validate.sh with a single script.
#
# Usage:
#   bash specboot.sh --init   Verify project structure (local setup)
#   bash specboot.sh --ci     Validate configuration for CI (no side effects, strict exit codes)
#   bash specboot.sh --help   Show this help

# Resolve the script directory; only change cwd when executed directly
# (not when sourced for tests).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Capture the directory the user invoked the script from. For `init` this is the
# project being bootstrapped (we cd into SCRIPT_DIR below for the validation modes).
ORIGINAL_PWD="$(pwd)"
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  # Validation modes (`--init`/`--ci`) validate the INVOCATION directory
  # (SPECBOOT-HARDEN-02, REQ-008): the framework repo in dogfooding, the
  # consumer project when this script is executed from
  # node_modules/@gabrielzavando/specboot. Project `init`/`update` target
  # $ORIGINAL_PWD explicitly regardless, so they keep running from the
  # framework source directory.
  case "${1:-}" in
    --init|--ci) cd "$ORIGINAL_PWD" ;;
    *) cd "$SCRIPT_DIR" ;;
  esac
fi

# Do NOT use 'set -e': this script counts errors/warnings and must keep running.
set -uo pipefail

# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() {
  echo -e "  ${RED}✗${NC} $1"
  ERRORS=$((ERRORS + 1))
}
warn() {
  echo -e "  ${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}
info() { echo -e "  ${BLUE}ℹ${NC} $1"; }

# ---------------------------------------------------------------------------
# Single source of truth: required files (shared by --init and --ci)
# ---------------------------------------------------------------------------
REQUIRED_FILES=(
  "AGENTS.md"
  "opencode.json"
  "LICENSE"
  "specboot.sh"
  "check-refs.sh"
  "README.md"
  "docs/base-standards.md"
  "docs/backend-standards.md"
  "docs/frontend-standards.md"
  "docs/documentation-standards.md"
  "docs/api/api-spec.yml"
  "docs/data-model/data-model.md"
  "docs/deploy-standards.md"
  "ai-specs/README.md"
  "ai-specs/agents/backend-developer.md"
  "ai-specs/agents/frontend-developer.md"
  "ai-specs/agents/build-agent.md"
  "ai-specs/skills/enrich-us/SKILL.md"
  "ai-specs/skills/commit/SKILL.md"
  "ai-specs/skills/code-auditing/SKILL.md"
  "ai-specs/skills/using-git-worktrees/SKILL.md"
  "ai-specs/skills/deploy/SKILL.md"
  "ai-specs/skills/onboarding/SKILL.md"
  ".github/pull_request_template.md"
  "scripts/read-json-field.mjs"
)

# Note: This template is OpenCode-only. Agent and skill artifacts live in
# ai-specs/ and are consumed directly by OpenCode via {file:...} references in
# opencode.json. No .claude/ or .cursor/ symlinks are created.

# Skill directories that must contain a SKILL.md.
SKILL_DIRS=(
  "ai-specs/skills/enrich-us"
  "ai-specs/skills/commit"
  "ai-specs/skills/code-auditing"
  "ai-specs/skills/using-git-worktrees"
  "ai-specs/skills/deploy"
  "ai-specs/skills/onboarding"
)

# Placeholder patterns that must NOT remain in docs/.
PLACEHOLDER_PATTERNS=(
  "\[definir stack"
  "\[Clean Architecture"
  "\[descripción del dominio"
  "\[nombre del cliente"
  "\[definir stack del proyecto"
)

# Example files (warn if missing).
EXAMPLE_FILES=(
  "ai-specs/examples/scenarios-example.md"
  "ai-specs/examples/requirements-example.md"
  "ai-specs/examples/ticket-ejemplo.md"
  "ai-specs/examples/tasks.md"
)

DEFAULT_MODEL="deepseek-v4-flash-free"

# ---------------------------------------------------------------------------
# Framework init (TICKET-3.1): bootstrap a new project with `specboot init`
# ---------------------------------------------------------------------------

# Files/dirs injected into the target project. Mirrors the `files` allowlist in
# package.json (the intocable set distributed via npm), extended with `.github/`
# (incl. pull_request_template.md) so a freshly initialized project passes
# `specboot.sh --ci` out of the box.
FRAMEWORK_ITEMS=(
  ".opencode/commands"
  ".opencode/agents"
  "ai-specs"
  "check-refs.sh"
  "release-bump.sh"
  "specboot.sh"
  "validate-specboot.sh"
  "templates/ci"
  "docs/base-standards.md"
  "docs/openspec-tasks-mandatory-steps.md"
  "docs/tdd-failure-protocol.md"
  "docs/framework-contract.md"
  "docs/docs-standard.md"
  "docs/specboot-json-standard.md"
  "docs/versioning-standard.md"
  "opencode.json"
  "AGENTS.md"
  "Makefile"
  "LICENSE"
  "README.md"
  "templates/github"
  "scripts/read-json-field.mjs"
)

# Resolve the framework source directory.
# Precedence: 1) explicit --template  2) the script's own directory (package or repo).
determine_framework_dir() {
  local template="$1"
  if [ -n "$template" ]; then
    if [ -d "$template" ]; then
      echo "$template"
      return 0
    fi
    echo "❌ --template directorio no encontrado: $template" >&2
    return 1
  fi
  # The script being executed IS the framework (installed package or repo root).
  echo "$SCRIPT_DIR"
  return 0
}

# Copy framework intocable items from $1 (src) into $2 (dst), never overwriting.
copy_framework_files() {
  local src="$1" dst="$2"
  local item src_path dst_path dst_parent
  for item in "${FRAMEWORK_ITEMS[@]}"; do
    src_path="$src/$item"
    dst_path="$dst/$item"
    if [ ! -e "$src_path" ]; then
      warn "Origen no encontrado, se omite: $item"
      continue
    fi
    if [ -e "$dst_path" ]; then
      warn "Omite $item (ya existe en el proyecto, no se sobrescribe)"
      continue
    fi
    # Ensure the parent directory exists (handles nested items like .opencode/commands).
    dst_parent="$(dirname "$dst_path")"
    mkdir -p "$dst_parent"
    if [ -d "$src_path" ]; then
      cp -R "$src_path" "$dst_path" 2>/dev/null
    else
      cp "$src_path" "$dst_path" 2>/dev/null
    fi
    if [ -e "$dst_path" ]; then
      pass "copiado: $item"
    else
      warn "falló la copia de: $item"
    fi
  done
}

# Install the GitHub consumer artifacts into the target from the templates.
# Only the consumer CI workflow and the PR template are installed by default;
# the internal release.yml/deploy.yml workflows are NEVER copied (Health-2 /
# SPECBOOT-HARDEN-02, REQ-001/REQ-003). Never overwrites an existing file.
install_github_artifacts() {
  local fw_dir="$1" dst="$2"
  mkdir -p "$dst/.github/workflows"
  local pr_src="$fw_dir/templates/github/pull_request_template.md"
  local ci_src="$fw_dir/templates/github/workflows/consumer-ci.yml"
  if [ -f "$pr_src" ] && [ ! -f "$dst/.github/pull_request_template.md" ]; then
    if cp "$pr_src" "$dst/.github/pull_request_template.md" 2>/dev/null; then
      pass "instalado: .github/pull_request_template.md"
    else
      warn "falló la instalación de .github/pull_request_template.md"
    fi
  fi
  if [ -f "$ci_src" ] && [ ! -f "$dst/.github/workflows/ci.yml" ]; then
    if cp "$ci_src" "$dst/.github/workflows/ci.yml" 2>/dev/null; then
      pass "instalado: .github/workflows/ci.yml (consumer CI)"
    else
      warn "falló la instalación de .github/workflows/ci.yml"
    fi
  fi
}

# Build a JSON array string from a comma/space separated list.
json_array() {
  local input="$1"
  local -a parts=()
  local IFS=', '
  # shellcheck disable=SC2206
  parts=($input)
  local out="[" first=1 p
  for p in "${parts[@]}"; do
    [ -z "$p" ] && continue
    [ "$first" -eq 1 ] && first=0 || out="$out,"
    out="$out\"$p\""
  done
  out="$out]"
  printf '%s' "$out"
}

# Create .specboot.json in $1 (target). Interactive=1 reads values from stdin.
create_initial_specboot_json() {
  local dst="$1" interactive="$2"
  local fw_version
  # Consumer-safe: always write the FRAMEWORK's version (resolve_framework_version),
  # never the project's root package.json version (the old bare call read CWD).
  fw_version="$(resolve_framework_version || true)"
  [ -z "$fw_version" ] && fw_version="0.0.0"

  local name="." services_json='["."]' stack_json='"framework"'

  if [ "$interactive" = "1" ]; then
    echo "📝 Configuración interactiva de .specboot.json"
    read -r -p "  Nombre del proyecto: " name
    [ -z "$name" ] && name="."
    read -r -p "  Stack (ej. node, python, framework; varios separados por coma): " stack_in
    read -r -p "  Services (ej. . o backend frontend; varios separados por coma): " services_in
    [ -z "$stack_in" ] && stack_in="framework"
    [ -z "$services_in" ] && services_in="."
    if echo "$stack_in" | grep -q ','; then
      stack_json="$(json_array "$stack_in")"
    else
      stack_json="\"$stack_in\""
    fi
    services_json="$(json_array "$services_in")"
  fi

  # Prefer node for safe JSON serialization when available.
  if command -v node >/dev/null 2>&1; then
    FW="$fw_version" NM="$name" SV="$services_json" ST="$stack_json" \
    node -e "const fs=require('fs');const o={frameworkVersion:process.env.FW,name:process.env.NM,description:'',services:JSON.parse(process.env.SV),stack:JSON.parse(process.env.ST)};fs.writeFileSync('$dst/.specboot.json',JSON.stringify(o,null,2)+'\n');" 2>/dev/null \
      && pass "creado: .specboot.json" \
      || echo "{\"frameworkVersion\":\"$fw_version\",\"name\":\"$name\",\"description\":\"\",\"services\":$services_json,\"stack\":$stack_json}" > "$dst/.specboot.json"
  else
    echo "{\"frameworkVersion\":\"$fw_version\",\"name\":\"$name\",\"description\":\"\",\"services\":$services_json,\"stack\":$stack_json}" > "$dst/.specboot.json"
    pass "creado: .specboot.json"
  fi
}

# Scaffold project-owned docs/ placeholder templates. Each file is created only if
# missing, so it never overwrites a project's existing docs/ (the 5 intocable docs
# were already copied into docs/ by copy_framework_files, which creates the dir).
create_docs_skeleton_if_missing() {
  local dst="$1"
  mkdir -p "$dst/docs/project" "$dst/docs/api" "$dst/docs/data-model"
  local created_any=0

  if [ ! -f "$dst/docs/backend-standards.md" ]; then
    cat > "$dst/docs/backend-standards.md" <<'MD'
# Backend Standards

> Personalizar este archivo con el stack backend real del proyecto.

## API Development
- RESTful o GraphQL según arquitectura del proyecto
- Versioning explícito en la URL: `/api/v1/`
- Respuestas consistentes: `{ data, error, meta }`

## Testing backend
- Unit tests para lógica de dominio y servicios
- Integration tests para repositorios y adapters
- Cobertura mínima: 90%
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/frontend-standards.md" ]; then
    cat > "$dst/docs/frontend-standards.md" <<'MD'
# Frontend Standards

> Personalizar este archivo con el stack frontend real del proyecto.

## Componentes
- Componentes pequeños y reutilizables (máx 400 líneas)
- Estado centralizado según corresponda (store, signals, etc.)
- Accesibilidad (a11y) como requisito, no optional

## Testing frontend
- Unit tests para componentes y lógica de presentación
- E2E para flujos críticos
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/ci-standards.md" ]; then
    cat > "$dst/docs/ci-standards.md" <<'MD'
# CI Standards — Mechanical SOLID/POO Enforcement

> Panorámico del Ticket 4. Define qué herramientas de análisis estático implementan
> mecánicamente los umbrales y principios declarados en backend/frontend standards.

## Cobertura por principio
- **DIP**: dependency-cruiser (regla directa)
- **SRP**: ESLint + sonarjs (umbrales de líneas/complejidad)
- **OCP/LSP/ISP**: juicio de code review (no mecánico)
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/deploy-standards.md" ]; then
    cat > "$dst/docs/deploy-standards.md" <<'MD'
# Deploy Standards

> Personalizar con el flujo de despliegue del proyecto.

## Entornos
- staging / production
- Versionado semántico (SemVer)

## Rollback
- Siempre definir un plan de rollback antes de desplegar
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/documentation-standards.md" ]; then
    cat > "$dst/docs/documentation-standards.md" <<'MD'
# Documentation Standards

## Principios
- La documentación se actualiza junto con el código, no después
- Los comentarios explican el por qué, no el qué

## Commits y PRs
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Un commit = un cambio lógico
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/project/domain.md" ]; then
    cat > "$dst/docs/project/domain.md" <<'MD'
# Dominio

> Plantilla del proyecto (propiedad del dev). Describir el dominio de negocio.

- Contexto: <!-- qué problema resuelve el software -->
- Entidades centrales: <!-- actores / agregados del dominio -->
- Reglas de negocio clave: <!-- invariantes que el sistema debe respetar -->
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/project/stack.md" ]; then
    cat > "$dst/docs/project/stack.md" <<'MD'
# Stack técnico

> Plantilla del proyecto (propiedad del dev). Completar con el stack real.

- Lenguajes: <!-- p.ej. TypeScript, PHP -->
- Frameworks: <!-- p.ej. NestJS, Angular -->
- Bases de datos: <!-- p.ej. PostgreSQL -->
- Infraestructura: <!-- p.ej. Docker, AWS -->
- Convenciones de commits: Conventional Commits
- Lenguaje del código: English
- Lenguaje de documentación cliente: Español
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/project/client.md" ]; then
    cat > "$dst/docs/project/client.md" <<'MD'
# Cliente / audiencia

> Plantilla del proyecto (propiedad del dev).

- Cliente: <!-- nombre del cliente / organización -->
- Audiencia final: <!-- quién usa el producto -->
- Stakeholders: <!-- quiénes deciden / reciben reportes -->
MD
    created_any=1
  fi

  if [ ! -f "$dst/docs/api/api-spec.yml" ]; then
    cat > "$dst/docs/api/api-spec.yml" <<'YML'
openapi: 3.0.3
info:
  title: API del Proyecto
  version: 0.1.0
  description: >
    Contrato OpenAPI del proyecto. Reemplazar con los endpoints reales.
paths: {}
components:
  schemas: {}
YML
    created_any=1
  fi

  if [ ! -f "$dst/docs/data-model/data-model.md" ]; then
    cat > "$dst/docs/data-model/data-model.md" <<'MD'
# Data Model

> Actualizar con las entidades reales del proyecto.

## Entidades del dominio

### Ejemplo: User

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| email | VARCHAR(255) UNIQUE | Email del usuario |
| created_at | TIMESTAMP | Fecha de creación |

## Reglas de negocio del dominio

> Documentar aquí las reglas que el agente debe respetar al generar código.
MD
    created_any=1
  fi

  if [ "$created_any" -eq 1 ]; then
    pass "plantillas de docs/ del proyecto creadas"
  else
    info "docs/ del proyecto ya existe, no se sobrescribe"
  fi
}

# Main entry for `specboot init`.
run_init_project() {
  local interactive=0
  local template=""
  # Strip the leading "init" token ($1) before parsing flags.
  shift
  while [ $# -gt 0 ]; do
    case "$1" in
      --interactive) interactive=1; shift ;;
      --template)    template="${2:-}"; shift 2 ;;
      --help|-h)     show_init_help; exit 0 ;;
      *) echo "Opción desconocida para init: $1"; echo "Usa 'specboot init --help'"; exit 2 ;;
    esac
  done

  local target="$ORIGINAL_PWD"
  local fw_dir
  if ! fw_dir="$(determine_framework_dir "$template")"; then
    exit 1
  fi

  echo "🔧 Zavando Specboot — Init"
  echo "================================"
  echo "  Target : $target"
  echo "  Source : $fw_dir"
  echo ""

  # Guard: do not clobber an already-initialized project.
  if [ -f "$target/.specboot.json" ]; then
    echo "⚠ Ya existe .specboot.json. Usa 'specboot update' para actualizar."
    exit 0
  fi

  echo "→ Copiando archivos del framework..."
  copy_framework_files "$fw_dir" "$target"
  echo ""
  echo "→ Instalando artefactos GitHub de consumidores..."
  install_github_artifacts "$fw_dir" "$target"
  echo ""
  echo "→ Creando .specboot.json..."
  create_initial_specboot_json "$target" "$interactive"
  echo ""
  echo "→ Creando esqueleto de docs/..."
  create_docs_skeleton_if_missing "$target"
  echo ""
  echo "✅ Proyecto inicializado con specboot."
  echo ""
  echo "Próximos pasos:"
  echo "   1. Editar docs/project/{domain,stack,client}.md con el contexto real"
  echo "   2. Editar docs/backend-standards.md y docs/frontend-standards.md según tu stack"
  echo "   3. Editar .specboot.json (services, stack)"
  echo "   4. Correr: bash specboot.sh --init   # verificar estructura"
  echo "   5. Correr: openspec init"
}

show_init_help() {
  cat <<'HELP'
Uso: specboot init [opciones]

Inicializa un proyecto nuevo inyectando los archivos del framework Specboot.

Opciones:
  --interactive   Solicita nombre, stack y services de forma interactiva.
  --template DIR  Usa DIR como origen de los archivos del framework.
  --help, -h      Muestra esta ayuda.

El comando:
  1. Verifica que no exista .specboot.json (si existe, sugiere 'specboot update').
  2. Copia los archivos intocables del framework al directorio actual.
  3. Crea .specboot.json con valores por defecto o interactivos.
  4. Crea el esqueleto de docs/ si no existe (no sobrescribe docs/ del proyecto).
HELP
}

# ---------------------------------------------------------------------------
# Framework update (TICKET-3.2): refresh an already-initialized project.
# ---------------------------------------------------------------------------

# Replacement set for `update`. Mirrors the `files` allowlist in package.json EXCEPT
# it deliberately EXCLUDES project-owned files that `init` only drops into empty
# projects: `README.md` and `LICENSE`. `.github` is handled file-by-file (only the
# framework's own `.github/workflows/*` are replaced) so a project-authored workflow
# is never deleted by an `rm -rf`.
UPDATE_ITEMS=(
  ".opencode/commands"
  ".opencode/agents"
  "ai-specs"
  "check-refs.sh"
  "release-bump.sh"
  "specboot.sh"
  "validate-specboot.sh"
  "templates/ci"
  "docs/base-standards.md"
  "docs/openspec-tasks-mandatory-steps.md"
  "docs/tdd-failure-protocol.md"
  "docs/framework-contract.md"
  "docs/docs-standard.md"
  "docs/specboot-json-standard.md"
  "docs/versioning-standard.md"
  "opencode.json"
  "AGENTS.md"
  "Makefile"
  "templates/github"
  "scripts/read-json-field.mjs"
)

# Resolve the installed framework version.
# Precedence: 1) explicit --template dir 2) the script's own package.json (dogfooding).
get_installed_version() {
  local template="$1"
  if [ -n "$template" ] && [ -f "$template/package.json" ]; then
    get_framework_version "$template" && return 0
  fi
  get_framework_version "$SCRIPT_DIR"
}

# Classify the version jump between declared (project) and installed (framework).
# Echoes: major | minor | patch | eq | older | bad
semver_jump() {
  local declared="$1" installed="$2"
  local a_major a_minor a_patch b_major b_minor b_patch
  a_major="${declared%%+*}"; a_major="${a_major%%-*}"
  b_major="${installed%%+*}"; b_major="${b_major%%-*}"
  IFS='.' read -r a_major a_minor a_patch <<< "$a_major"
  IFS='.' read -r b_major b_minor b_patch <<< "$b_major"
  a_major=${a_major:-0}; a_minor=${a_minor:-0}; a_patch=${a_patch:-0}
  b_major=${b_major:-0}; b_minor=${b_minor:-0}; b_patch=${b_patch:-0}
  if [ "$a_major" -lt "$b_major" ]; then echo "major"; return; fi
  if [ "$a_major" -gt "$b_major" ]; then echo "older"; return; fi
  if [ "$a_minor" -lt "$b_minor" ]; then echo "minor"; return; fi
  if [ "$a_minor" -gt "$b_minor" ]; then echo "older"; return; fi
  if [ "$a_patch" -lt "$b_patch" ]; then echo "patch"; return; fi
  if [ "$a_patch" -gt "$b_patch" ]; then echo "older"; return; fi
  echo "eq"
}

# Read frameworkVersion from a .specboot.json (node, fallback grep).
read_specboot_json_version() {
  local file="$1"
  if command -v node >/dev/null 2>&1; then
    node -e "try{console.log(require('$file').frameworkVersion||'')}catch(e){}" 2>/dev/null && return
  fi
  grep -o '"frameworkVersion"[[:space:]]*:[[:space:]]*"[^"]*"' "$file" 2>/dev/null | sed 's/.*:"//;s/"//'
}

# Write frameworkVersion preserving all other fields and 2-space JSON formatting.
write_specboot_json_version() {
  local file="$1" ver="$2"
  if command -v node >/dev/null 2>&1; then
    FW="$ver" node -e "
      const fs=require('fs');const p='$file';
      const o=JSON.parse(fs.readFileSync(p,'utf8'));
      o.frameworkVersion=process.env.FW;
      fs.writeFileSync(p,JSON.stringify(o,null,2)+'\n');
    " 2>/dev/null && return 0
  fi
  # Fallback without node: crude in-place sed on the frameworkVersion line.
  if grep -q '"frameworkVersion"' "$file"; then
    sed -i.bak "s/\"frameworkVersion\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"frameworkVersion\": \"$ver\"/" "$file" 2>/dev/null \
      && rm -f "$file.bak" && return 0
  fi
  return 1
}

# Back up the current versions of the items about to be replaced.
backup_framework_files() {
  local src="$1" dst="$2" backup_dir="$3"
  mkdir -p "$backup_dir"
  local item src_path dst_path
  for item in "${UPDATE_ITEMS[@]}"; do
    src_path="$src/$item"
    dst_path="$dst/$item"
    if [ ! -e "$dst_path" ]; then
      continue
    fi
    # Mirror the destination path under the backup dir.
    local rel_parent
    rel_parent="$(dirname "$item")"
    if [ "$rel_parent" = "." ]; then
      cp -R "$dst_path" "$backup_dir/" 2>/dev/null
    else
      mkdir -p "$backup_dir/$rel_parent"
      cp -R "$dst_path" "$backup_dir/$rel_parent/" 2>/dev/null
    fi
  done
}

# Replace the intocable items (opción A: without mercy). README.md / LICENSE are NOT
# in UPDATE_ITEMS, so they are never touched. .github is replaced file-by-file.
replace_framework_files() {
  local src="$1" dst="$2"
  local item src_path dst_path dst_parent
  for item in "${UPDATE_ITEMS[@]}"; do
    # Never touch docs/ or .github as whole trees. Individual framework docs
    # (docs/*.md) ARE replaced — archived spec specboot-update requires
    # overwriting the 6 framework docs — so only whole-tree entries are
    # skipped here (fix: the legacy docs/* pattern silently dropped ALL docs).
    case "$item" in
      docs|.github) continue ;;
    esac
    src_path="$src/$item"
    dst_path="$dst/$item"
    if [ ! -e "$src_path" ]; then
      warn "Origen no encontrado, se omite: $item"
      continue
    fi
    dst_parent="$(dirname "$dst_path")"
    mkdir -p "$dst_parent"
    if [ -d "$src_path" ]; then
      if [ "$item" = ".github/workflows" ]; then
        # File-by-file: replace only the framework's own workflows, never delete a
        # project-authored workflow (which would be lost by a recursive rm -rf).
        local f
        for f in "$src_path"/*; do
          [ -e "$f" ] || continue
          cp "$f" "$dst_path/" 2>/dev/null && pass "reemplazado: $item/$(basename "$f")"
        done
      else
        rm -rf "$dst_path"
        cp -R "$src_path" "$dst_path" 2>/dev/null
      fi
    else
      cp "$src_path" "$dst_path" 2>/dev/null
    fi
    if [ -e "$dst_path" ]; then
      pass "reemplazado: $item"
    else
      warn "falló el reemplazo de: $item"
    fi
  done
}

# Append the backup pattern to .gitignore if the file exists and lacks it.
ensure_gitignore_entry() {
  local dst="$1"
  local gitignore="$dst/.gitignore"
  if [ ! -f "$gitignore" ]; then
    return 0
  fi
  if grep -q '.specboot-backup-\*' "$gitignore" 2>/dev/null; then
    return 0
  fi
  printf '\n# Specboot update backups\n.specboot-backup-*\n' >> "$gitignore" 2>/dev/null \
    && info "Añadido .specboot-backup-* a .gitignore"
}

# Known framework-owned legacy release.yml content fingerprints (git blob hashes)
# of EVERY release.yml variant Specboot distributed to consumers before artifact
# isolation (SPECBOOT-HARDEN-02, REQ-002):
#   v1 87847ce0... — initial release workflow (ea2f096)
#   v2 ed2a6f7d... — node 24 bump / orphan publish removed (033806f)
#   v3 122cb15d... — idempotent publish (e68135b, last distributed)
# These hashes describe IMMUTABLE legacy content — never derived from the current internal
# .github/workflows/release.yml, which may evolve freely and is no longer
# distributed. A consumer file matching ANY allowlisted hash is a framework-owned
# legacy artifact (backed up + removed by update); anything else is never
# auto-deleted. The regression suite (tests/specboot-update-test.sh) re-derives
# every pre-isolation variant from git history and fails if this allowlist
# drifts from the distributed history.
KNOWN_RELEASE_FINGERPRINTS=(
  "87847ce00d9dd02e98302962cdc39787194a5733"  # v1 — initial release workflow
  "ed2a6f7dd68b0e29e7b4bf1c78c6b8611b360871"  # v2 — node 24 bump, orphan publish removed
  "122cb15dccf07599ef4ddd494e3f9a3643e8948f"  # v3 — idempotent publish (last distributed)
)

# True when the fingerprint matches any known legacy framework-owned variant.
is_known_legacy_release_fingerprint() {
  local fp="$1" known
  for known in "${KNOWN_RELEASE_FINGERPRINTS[@]}"; do
    [ "$fp" = "$known" ] && return 0
  done
  return 1
}

# Known consumer CI content fingerprints (git blob hashes) of EVERY consumer CI
# variant Specboot distributed since 0.10.0 (SPECBOOT-HARDEN-04, REQ-001):
#   v1 99394ca6... — internal .github/workflows/ci.yml @ tag v0.10.0 (pinned
#     commit cf50b18, the last pre-tag change); distributed by the pre-isolation
#     `specboot update`, which copied the internal ci.yml into consumers.
#   v2 a0041c33... — templates/github/workflows/consumer-ci.yml (pinned commit
#     0c586db, SPECBOOT-HARDEN-02); first distributed with 0.11.0.
# These are IMMUTABLE historical content fingerprints of every consumer CI variant
# distributed since 0.10.0, each with verifiable git provenance. They are
# never derived from the current internal .github/workflows/ci.yml (mutable,
# internal-only, may evolve freely): templates/github/workflows/consumer-ci.yml
# is the only distributable consumer CI source. A consumer ci.yml matching ANY
# allowlisted hash is a framework-owned distributed artifact (the update policy
# backs it up and replaces it); anything else is never overwritten automatically.
# The regression suite (tests/specboot-update-test.sh) re-derives every variant
# from git history and fails if this allowlist drifts from the distributed
# history.
KNOWN_CONSUMER_CI_FINGERPRINTS=(
  "99394ca62f790f33e6f6fb506c41a458f6e65340"  # v1 — ci.yml @ v0.10.0 (cf50b18, pre-isolation copy)
  "a0041c332f799156606062a037458b4ca525008c"  # v2 — consumer-ci.yml template @ 0c586db (first shipped in 0.11.0)
)

# True when the fingerprint matches any known distributed consumer CI variant.
is_known_consumer_ci_fingerprint() {
  local fp="$1" known
  for known in "${KNOWN_CONSUMER_CI_FINGERPRINTS[@]}"; do
    [ "$fp" = "$known" ] && return 0
  done
  return 1
}

# Return a stable content fingerprint of a file (git blob hash; git is always
# available in this git-based framework). Empty string when it cannot be computed.
content_fingerprint() {
  local f="$1"
  if command -v git >/dev/null 2>&1; then
    git hash-object "$f" 2>/dev/null
  fi
}

# Tri-state safe policy for the consumer's .github/workflows/ci.yml on update
# (SPECBOOT-HARDEN-04, REQ-002/REQ-003). Applied identically in dogfooding and
# consumer mode (the template and the allowlist come from the running framework):
#   1. Missing file            -> install the current template and report it.
#   2. Exact match with the current template (content fingerprint) -> idempotent
#      no-op: no backup, no rewrite, no warning.
#   3. Fingerprint matches the KNOWN_CONSUMER_CI_FINGERPRINTS allowlist (a
#      variant Specboot actually distributed) -> BACK UP the original into
#      $backup_dir/.github/workflows/ci.yml (when backup_dir is non-empty,
#      mirroring repair_legacy_release) BEFORE replacing it with the current
#      template, then report the repair. The backup uses cp -p (preserves the
#      original's metadata) and is VERIFIED: if it fails, ci.yml is NOT
#      replaced — the function emits a clear error to stderr and returns 1
#      (non-successful state), keeping the original byte-for-byte intact.
#   The INSTALL (1) and REPLACE (3) copies are also VERIFIED (SC-015): if the
#   cp fails, or the final destination does NOT match the expected template
#   (partial/corrupt write), the function returns 1 with a clear error — a
#   partial write is NEVER reported as a successful install/repair.
#   4. Modified or foreign content -> preserve the file byte-for-byte and warn,
#      requiring explicit manual resolution; it is NEVER overwritten
#      automatically (no silent overwrite).
# Custom consumer workflows are never evaluated or touched here: only ci.yml is
# handled, and no operation copies the whole .github directory.
update_consumer_ci_safely() {
  local fw_dir="$1" dst="$2" backup_dir="${3:-}"
  local ci_src="$fw_dir/templates/github/workflows/consumer-ci.yml"
  local ci_dst="$dst/.github/workflows/ci.yml"
  if [ ! -f "$ci_src" ]; then
    return 0
  fi
  # (1) Missing -> install and report.
  if [ ! -f "$ci_dst" ]; then
    # Verified install (SC-015): the copy must succeed AND the destination
    # must match the expected template before reporting success. A failed or
    # partial/corrupt install is never reported as a successful one.
    if ! cp "$ci_src" "$ci_dst" 2>/dev/null || ! cmp -s "$ci_dst" "$ci_src"; then
      echo "❌ No se pudo instalar .github/workflows/ci.yml con la plantilla actual; verifica permisos y reintenta" >&2
      return 1
    fi
    pass "instalado: .github/workflows/ci.yml (consumer CI)"
    return 0
  fi
  local fp tpl_fp
  fp="$(content_fingerprint "$ci_dst")"
  tpl_fp="$(content_fingerprint "$ci_src")"
  # (2) Exact match with the current template -> idempotent no-op.
  if [ -n "$fp" ] && [ "$fp" = "$tpl_fp" ]; then
    info "ci.yml de consumidor ya coincide con la plantilla actual; no-op idempotente (sin cambios)."
    return 0
  fi
  # (3) Known distributed variant -> back up BEFORE replacing, then repair.
  if [ -n "$fp" ] && is_known_consumer_ci_fingerprint "$fp"; then
    if [ -n "$backup_dir" ]; then
      # Verified backup (SPECBOOT-HARDEN-04 follow-up, REQ-002, SC-013): the
      # backup MUST be verified explicitly. cp -p preserves the original's
      # metadata for a faithful restore. A FAILED backup must NEVER lead to a
      # replacement — at that point the in-place file is the consumer's only
      # copy, so the policy aborts with a clear error and a non-successful
      # state, keeping ci.yml byte-for-byte intact.
      mkdir -p "$backup_dir/.github/workflows" 2>/dev/null
      if ! cp -p "$ci_dst" "$backup_dir/.github/workflows/ci.yml" 2>/dev/null; then
        echo "❌ No se pudo respaldar .github/workflows/ci.yml en $backup_dir/.github/workflows/ci.yml — ci.yml NO se reemplaza y permanece byte a byte intacto (resuelve manualmente o reintenta el update)" >&2
        return 1
      fi
    fi
    # Verified replacement (SC-015): the copy must succeed AND the destination
    # must match the expected template before reporting the repair. A failed
    # or partial/corrupt replacement is never reported as a successful repair —
    # it returns 1 with a clear error. (ci.yml is still the consumer's original
    # if the cp failed; if it partially wrote, the mismatch is caught here.)
    if ! cp "$ci_src" "$ci_dst" 2>/dev/null || ! cmp -s "$ci_dst" "$ci_src"; then
      echo "❌ Falló el reemplazo de .github/workflows/ci.yml (el destino no coincide con la plantilla esperada); revisa el archivo y resuelve manualmente o reintenta" >&2
      return 1
    fi
    pass "reparado: .github/workflows/ci.yml era una variante histórica distribuida por Specboot (respaldado${backup_dir:+ en $backup_dir/.github/workflows/ci.yml} y reemplazado por la plantilla actual)"
    return 0
  fi
  # (4) Modified or foreign content -> preserve + explicit-resolution warning.
  warn ".github/workflows/ci.yml modificado o ajeno NO se sobrescribió; requiere resolución explícita manual (conservado byte a byte, nunca se sobrescribe automáticamente)"
}

# Refresh the consumer GitHub artifacts (consumer CI + PR template) into the
# target from the templates. The consumer CI workflow is NOT overwritten
# unconditionally: it goes through the tri-state safe policy
# (update_consumer_ci_safely, SPECBOOT-HARDEN-04 REQ-002/REQ-003). The PR
# template remains framework-owned and keeps its current update behavior
# (replaced without mercy when the template exists). Custom consumer workflows
# are never touched and no operation copies the whole .github directory
# (SPECBOOT-HARDEN-02, REQ-001/REQ-003).
update_github_artifacts() {
  local fw_dir="$1" dst="$2" backup_dir="${3:-}"
  mkdir -p "$dst/.github/workflows"
  local pr_src="$fw_dir/templates/github/pull_request_template.md"
  # Propagate the tri-state policy's failure (SPECBOOT-HARDEN-04 follow-up,
  # SC-013): a failed ci.yml backup must surface as a non-successful state,
  # never be swallowed by the caller.
  if ! update_consumer_ci_safely "$fw_dir" "$dst" "$backup_dir"; then
    return 1
  fi
  if [ -f "$pr_src" ]; then
    if cp "$pr_src" "$dst/.github/pull_request_template.md" 2>/dev/null; then
      pass "reemplazado: .github/pull_request_template.md"
    else
      warn "falló el reemplazo de .github/pull_request_template.md"
    fi
  fi
}

# Repair a contaminated consumer: remove the framework-owned legacy release.yml
# (backed up first) when it matches ANY fingerprint of the historical allowlist
# exactly; otherwise warn and require explicit resolution (never auto-delete a
# modified or consumer-owned release.yml). Custom workflows are never touched.
repair_legacy_release() {
  local dst="$1" backup_dir="$2"
  local legacy="$dst/.github/workflows/release.yml"
  [ -f "$legacy" ] || return 0
  local fp
  fp="$(content_fingerprint "$legacy")"
  if [ -n "$fp" ] && is_known_legacy_release_fingerprint "$fp"; then
    if [ -n "$backup_dir" ]; then
      mkdir -p "$backup_dir/.github/workflows"
      cp "$legacy" "$backup_dir/.github/workflows/release.yml" 2>/dev/null
    fi
    rm -f "$legacy"
    pass "eliminado release.yml heredado de Specboot (respaldado${backup_dir:+ en $backup_dir})"
  else
    warn "release.yml en .github/workflows/ NO coincide con la firma framework-owned y NO se eliminó; requiere resolución explícita manual (nunca se auto-elimina un archivo modificado o ajeno)"
  fi
}

run_update_project() {
  local interactive_confirm=1   # 1 = ask; 0 = --yes
  local template=""
  local dry_run=0
  local no_backup=0

  # Strip the leading "update" token ($1) before parsing flags.
  shift
  while [ $# -gt 0 ]; do
    case "$1" in
      --yes)        interactive_confirm=0; shift ;;
      --template)   template="${2:-}"; shift 2 ;;
      --dry-run)    dry_run=1; shift ;;
      --no-backup)  no_backup=1; shift ;;
      --help|-h)    show_update_help; exit 0 ;;
      *) echo "Opción desconocida para update: $1"; echo "Usa 'specboot update --help'"; exit 2 ;;
    esac
  done

  local target="$ORIGINAL_PWD"

  echo "🔄 Zavando Specboot — Update"
  echo "================================"
  echo "  Target : $target"

  # 1. Guard: .specboot.json must exist.
  if [ ! -f "$target/.specboot.json" ]; then
    echo "❌ No existe .specboot.json. Usa 'specboot init' para crearlo."
    exit 1
  fi

  # 2. Resolve the framework source directory.
  local fw_dir
  if ! fw_dir="$(determine_framework_dir "$template")"; then
    exit 1
  fi
  echo "  Source : $fw_dir"

  # Dogfooding guard: target == source -> nothing to sync.
  if [ "$target" = "$fw_dir" ]; then
    info "Target y template son iguales; no se sincroniza (usa --template para otro origen)."
    return 0
  fi

  # 3. Read versions and compare.
  local declared installed jump
  declared="$(read_specboot_json_version "$target/.specboot.json")"
  installed="$(get_installed_version "$template")"
  echo "  Current: ${declared:-desconocido}  Installed: ${installed:-desconocido}"

  if [ -z "$installed" ]; then
    echo "❌ No se pudo determinar la versión instalada del framework."
    exit 1
  fi
  if [ -z "$declared" ]; then
    echo "❌ No se pudo leer frameworkVersion de .specboot.json."
    exit 1
  fi

  jump="$(semver_jump "$declared" "$installed")"
  case "$jump" in
    older)
      echo "❌ La versión instalada ($installed) es menor que la requerida ($declared)."
      echo "   El proyecto requiere una versión más nueva del framework; no se puede retroceder."
      exit 1
      ;;
    bad)
      echo "❌ No se pudo comparar la versión (formato inesperado): declarada='$declared', instalada='$installed'."
      exit 1
      ;;
  esac

  # 4. Breaking-change warning on major jump.
  if [ "$jump" = "major" ]; then
    echo "⚠️ Breaking change. Lee CHANGELOG/release notes de v$installed"
    echo "El puente AGENTS.md y los estándares pueden haber cambiado."
    if [ "$interactive_confirm" -eq 1 ]; then
      echo -n "¿Proceder? (y/N): "
      read -r ANSWER
      if [ "$ANSWER" != "y" ] && [ "$ANSWER" != "Y" ]; then
        echo "Cancelado."
        exit 0
      fi
    fi
  fi

  if [ "$dry_run" -eq 1 ]; then
    echo ""
    echo "→ Dry-run: se reemplazarían los siguientes items (salto: $jump):"
    local item
    for item in "${UPDATE_ITEMS[@]}"; do
      case "$item" in
        docs/*|docs|.github) continue ;;
      esac
      echo "    - $item"
    done
    info "Dry-run: no se modificó nada."
    return 0
  fi

  # 5. Backup.
  local backup_dir=""
  if [ "$no_backup" -eq 0 ]; then
    backup_dir="$target/.specboot-backup-$(date +%Y%m%d%H%M%S)"
    backup_framework_files "$fw_dir" "$target" "$backup_dir"
    ensure_gitignore_entry "$target"
  fi

  # 6. Replace framework intocable files (opción A).
  echo ""
  echo "→ Reemplazando archivos del framework..."
  replace_framework_files "$fw_dir" "$target"

  # 6b. Refresh consumer GitHub artifacts (ci.yml via the tri-state safe policy,
  #     PR template unchanged) and repair a contaminated consumer. A failed
  #     ci.yml backup stops the update with a non-successful state (SC-013):
  #     ci.yml stays intact and the consumer must resolve explicitly.
  echo ""
  echo "→ Actualizando artefactos GitHub de consumidores..."
  if ! update_github_artifacts "$fw_dir" "$target" "$backup_dir"; then
    echo "❌ El update se detuvo: no se pudo respaldar .github/workflows/ci.yml antes de repararlo; ci.yml permanece intacto${backup_dir:+ (backup parcial en $backup_dir)}. Resuelve manualmente y re-ejecuta."
    exit 1
  fi
  repair_legacy_release "$target" "$backup_dir"

  # 7. Rewrite frameworkVersion if it changed (eq = leave intact).
  if [ "$jump" != "eq" ]; then
    if write_specboot_json_version "$target/.specboot.json" "$installed"; then
      pass "frameworkVersion actualizado a $installed"
    else
      warn "No se pudo reescribir frameworkVersion en .specboot.json"
    fi
  else
    info "Versión igual; .specboot.json no se modifica."
  fi

  # 8. Post-update validation.
  echo ""
  echo "Validando estructura post-actualización..."
  # check-refs.sh is a framework-owned script that validates the framework's own
  # {file:...} integrity (update's own responsibility), so it MUST run from the
  # framework directory ($SCRIPT_DIR), not from the project target. It is strict:
  # a broken reference means update shipped a broken reference -> exit 1.
  if ! ( cd "$SCRIPT_DIR" && bash check-refs.sh ); then
    echo "❌ check-refs.sh falló. Revisa los cambios; backup en: $backup_dir"
    exit 1
  fi
  pass "check-refs.sh OK"
  # specboot.sh --ci audits project completeness and legitimately warns on incomplete
  # consumer docs/; report but do NOT block (failsafe for real projects). Run it in the
  # target so it inspects the updated project.
  if ! ( cd "$target" && bash "$SCRIPT_DIR/specboot.sh" --ci --yes ); then
    warn "specboot.sh --ci reportó advertencias/errores de completitud del proyecto (no bloquea)."
  fi

  echo ""
  if [ -n "$backup_dir" ]; then
    echo "✅ Proyecto actualizado a $installed. Backup en $backup_dir"
  else
    echo "✅ Proyecto actualizado a $installed (sin backup: --no-backup)."
  fi
}

show_update_help() {
  cat <<'HELP'
Uso: specboot update [opciones]

Actualiza un proyecto ya inicializado reemplazando los archivos intocables del framework.

Opciones:
  --template DIR  Usa DIR como origen de los archivos del framework.
  --yes           No pedir confirmación en saltos major (para CI / no-TTY).
  --dry-run       Muestra qué se reemplazaría sin cambiar nada.
  --no-backup     Opt-out EXPLÍCITO del respaldo (.specboot-backup-* de los archivos
                  del framework y del ci.yml de consumidores). Solo con esta bandera se omite
                  el respaldo; la verificación del reemplazo del ci.yml (coincidencia con la
                  plantilla esperada) sigue aplicando (SC-013/SC-015).
  --help, -h      Muestra esta ayuda.

El comando:
  1. Verifica que exista .specboot.json (si no, sugiere 'specboot init').
  2. Lee frameworkVersion y compara con la versión instalada.
  3. Avisa de breaking change en saltos major; reemplaza en silencio en minor/patch.
  4. Reemplaza los archivos intocables sin tocar docs/ del proyecto ni el código.
  5. Reescribe frameworkVersion en .specboot.json (salvo que sea igual).
HELP
}

# ---------------------------------------------------------------------------
# Checks (shared)
# ---------------------------------------------------------------------------
check_file_structure() {
  echo "→ Verificando estructura de archivos..."
  local f
  for f in "${REQUIRED_FILES[@]}"; do
    if [ -f "$f" ]; then
      pass "$f"
    else
      fail "FALTA: $f"
    fi
  done
}

check_placeholders() {
  echo "→ Verificando placeholders sin reemplazar..."
  local pattern found=false
  for pattern in "${PLACEHOLDER_PATTERNS[@]}"; do
    if grep -rqE "$pattern" docs/ 2>/dev/null; then
      warn "Placeholder '$pattern' encontrado en: $(grep -rlE "$pattern" docs/ 2>/dev/null | tr '\n' ', ')"
      found=true
    fi
  done
  if [ "$found" = false ]; then
    pass "Sin placeholders detectados en docs/"
  fi
}

check_opencode_json() {
  echo "→ Verificando opencode.json..."
  if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('opencode.json'))" 2>/dev/null; then
      pass "opencode.json es JSON válido"
      if grep -q "\"model\": \"$DEFAULT_MODEL\"" opencode.json 2>/dev/null; then
        warn "opencode.json usa el model por defecto ($DEFAULT_MODEL)"
      else
        pass "Model personalizado configurado"
      fi
    else
      fail "opencode.json tiene errores de sintaxis"
    fi
  else
    warn "Node.js no instalado, no se puede validar JSON"
  fi
}

check_skills() {
  echo "→ Verificando skills..."
  local skill
  for skill in "${SKILL_DIRS[@]}"; do
    if [ -d "$skill" ] && [ -f "$skill/SKILL.md" ]; then
      pass "$skill/SKILL.md"
    else
      fail "$skill/SKILL.md (falta)"
    fi
  done
}

check_examples() {
  echo "→ Verificando ejemplos..."
  local ex
  for ex in "${EXAMPLE_FILES[@]}"; do
    if [ -f "$ex" ]; then
      pass "$ex"
    else
      warn "$ex (falta - agregar para mejores ejemplos)"
    fi
  done
}

check_git_hooks() {
  echo "→ Verificando git hooks..."
  if [ -f ".husky/commit-msg" ]; then
    pass "commit-msg hook instalado"
  elif [ -d ".husky" ]; then
    warn "Directorio .husky existe pero commit-msg no configurado"
  else
    info "Husky no instalado (opcional)"
  fi
}

check_ci_cd() {
  echo "→ Verificando CI/CD..."
  if [ -f ".github/workflows/ci.yml" ]; then
    pass "GitHub Actions CI configurado"
  else
    warn ".github/workflows/ci.yml no encontrado"
  fi
  if [ -f ".commitlintrc.json" ]; then
    pass "commitlint configurado"
  else
    info ".commitlintrc.json no encontrado (opcional)"
  fi
}

# REQ-009 (SPECBOOT-HARDEN-02): check_permission_contracts() vive FUERA de
# check_ci_cd() para no depender del orden de ejecución. El validador vive en el
# paquete Specboot (node_modules en consumidores, scripts/ en dogfooding); el
# proyecto validado se pasa con --root; el manifiesto se lee desde el paquete.
check_permission_contracts() {
  echo "→ Verificando contratos de permisos de agentes..."
  local validator=""
  if [ -f "node_modules/@gabrielzavando/specboot/scripts/validate-agent-permissions.mjs" ]; then
    validator="node_modules/@gabrielzavando/specboot/scripts/validate-agent-permissions.mjs"
  elif [ -f "$SCRIPT_DIR/scripts/validate-agent-permissions.mjs" ]; then
    validator="$SCRIPT_DIR/scripts/validate-agent-permissions.mjs"
  fi
  if [ -z "$validator" ]; then
    fail "Validador de contratos de permisos no encontrado (ni en node_modules/@gabrielzavando/specboot ni en scripts/)"
    return
  fi
  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js no disponible: no se pudieron validar los contratos de permisos (fail-closed REQ-009)"
    return
  fi
  if node "$validator" --root .; then
    pass "Contratos de permisos de agentes conformes"
  else
    fail "Descalce de contratos de permisos de agentes (ver salida del validador)"
  fi
}

# REQ-007 (SPECBOOT-HARDEN-02): contratos de comandos (agent + subtask) validados
# desde el front matter. El validador vive en el paquete Specboot.
check_command_contracts() {
  echo "→ Verificando contratos de comandos..."
  local vcmd=""
  if [ -f "node_modules/@gabrielzavando/specboot/scripts/validate-command-contracts.mjs" ]; then
    vcmd="node_modules/@gabrielzavando/specboot/scripts/validate-command-contracts.mjs"
  elif [ -f "$SCRIPT_DIR/scripts/validate-command-contracts.mjs" ]; then
    vcmd="$SCRIPT_DIR/scripts/validate-command-contracts.mjs"
  fi
  if [ -z "$vcmd" ]; then
    fail "Validador de contratos de comandos no encontrado (ni en node_modules/@gabrielzavando/specboot ni en scripts/)"
    return
  fi
  if ! command -v node >/dev/null 2>&1; then
    fail "Node.js no disponible: no se pudieron validar los contratos de comandos"
    return
  fi
  if node "$vcmd" --root .; then
    pass "Contratos de comandos conformes"
  else
    fail "Descalce de contratos de comandos (ver salida del validador)"
  fi
}

check_refs() {
  echo "→ Verificando integridad referencial (check-refs.sh)..."
  if bash check-refs.sh; then
    return 0
  fi
  ERRORS=$((ERRORS + 1))
  return 1
}

get_framework_version() {
  local dir="${1:-.}"
  # require() treats a bare specifier as a package-name lookup, not a file path:
  # "node_modules/..." would fail silently under 2>/dev/null. Force an explicit
  # filesystem path for anything that is not already rooted (/* or ./*).
  case "$dir" in
    /*|./*) ;;
    *) dir="./$dir" ;;
  esac
  if [ -f "$dir/package.json" ] && command -v node >/dev/null 2>&1; then
    node -e "try{console.log(require('$dir/package.json').version)}catch(e){process.exit(1)}" 2>/dev/null
  fi
}

# Resolve the framework's own version, consumer-safe. Precedence:
#   1) node_modules/@gabrielzavando/specboot (consumer install, CWD-relative)
#   2) the package.json next to the script ($SCRIPT_DIR — dogfooding repo root)
# In a consumer running the root-copied specboot.sh, the package.json next to
# the script is the PROJECT's — hence the node_modules-first precedence. This is
# harmless in dogfooding: the framework repo does not self-depend, so the
# fallback resolves exactly as before the fix. Shared by show_version and
# create_initial_specboot_json so init writes the framework version too.
resolve_framework_version() {
  local v=""
  if [ -f "node_modules/@gabrielzavando/specboot/package.json" ]; then
    v="$(get_framework_version "node_modules/@gabrielzavando/specboot")"
  fi
  if [ -z "$v" ]; then
    v="$(get_framework_version "$SCRIPT_DIR")"
  fi
  echo "$v"
}

check_specboot_json() {
  echo "→ Verificando .specboot.json (validate-specboot.sh)..."
  if [ ! -f "validate-specboot.sh" ]; then
    warn "validate-specboot.sh no encontrado; se omite la validación de .specboot.json"
    return 0
  fi
  # Capture the child's exit code directly. validate-specboot.sh exits 0 on success
  # or on a non-blocking warning (e.g. missing file); it exits 1 on a hard config
  # error. A non-zero exit MUST propagate as a CI failure. We must NOT wrap the call
  # in `if bash validate-specboot.sh; then ...` because a no-else `if` returns 0 for
  # the false branch, which would swallow the hard-error exit code.
  bash validate-specboot.sh
  local rc=$?
  if [ "$rc" -ne 0 ]; then
    ERRORS=$((ERRORS + 1))
    return 1
  fi
  return 0
}

print_summary() {
  echo ""
  echo "================================"
  echo "📊 Resumen"
  echo "================================"
  echo -e "  ${RED}Errores: $ERRORS${NC}"
  echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
}

# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------
run_init() {
  echo "🔧 Zavando Specboot — Setup SDD"
  echo "================================"
  echo ""
  check_file_structure
  echo ""
  check_placeholders
  echo ""
  check_opencode_json
  echo ""
  print_summary

  if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Setup incompleto: faltan archivos requeridos.${NC}"
    echo "Revisar la estructura del repositorio."
    exit 1
  fi

  echo ""
  echo "✅ Setup completo."
  if [ "$WARNINGS" -gt 0 ]; then
    echo ""
    echo "⚠️  Recuerda personalizar los archivos docs/ antes de comenzar."
  fi
  echo ""
  echo "Próximos pasos:"
  echo "   1. Editar docs/base-standards.md con el stack del proyecto"
  echo "   2. Editar docs/backend-standards.md y docs/frontend-standards.md"
  echo "   3. Actualizar opencode.json con el modelo y reglas del proyecto"
  echo "   4. Ejecutar: openspec init"
  echo "   5. Comenzar con: /enrich-us TICKET-ID o /plan-change TICKET-ID"
}

run_ci() {
  echo "🔍 Zavando Specboot — Validation (CI)"
  echo "================================"
  echo ""
  check_refs || exit 1
  echo ""
  check_specboot_json
  echo ""
  check_file_structure
  echo ""
  check_placeholders
  echo ""
  check_opencode_json
  echo ""
  check_skills
  echo ""
  check_examples
  echo ""
  check_git_hooks
  echo ""
  check_ci_cd
  echo ""
  check_permission_contracts
  echo ""
  check_command_contracts
  echo ""
  print_summary

  if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ Validación fallida${NC}"
    echo "Corrige los errores antes de continuar."
    exit 1
  elif [ "$WARNINGS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Validación con warnings${NC}"
    echo "Revisa los warnings opcionales."
    exit 0
  else
    echo ""
    echo -e "${GREEN}✅ Validación exitosa${NC}"
    echo "El proyecto está correctamente configurado."
    exit 0
  fi
}

show_help() {
  sed -n '2,8p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  echo ""
  echo "Subcomandos de proyecto:"
  echo "  init     Inicializa un proyecto nuevo (inyecta archivos + .specboot.json + docs/)"
  echo "  update   Actualiza un proyecto existente (reemplaza archivos intocables)"
}

show_version() {
  local v
  # Consumer-safe resolution: prefer the installed framework package over the
  # script's neighbor package.json (which is the PROJECT's root package.json in
  # a consumer running the root-copied specboot.sh).
  v=$(resolve_framework_version)
  if [ -n "$v" ]; then
    echo "$v"
  else
    # Do NOT fabricate a SemVer: an empty/"unknown" string lets validate-specboot.sh
    # skip the version comparison (non-blocking warning) instead of erroring on a
    # freshly initiated project that has no package.json at its root.
    echo "unknown"
  fi
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  case "${1:-}" in
    --init) run_init ;;
    --ci)   run_ci ;;
    --version|-v) show_version ;;
    --help|-h|"") show_help ;;
    init) run_init_project "$@" ;;
    update) run_update_project "$@" ;;
    *) echo "Opción desconocida: $1"; echo "Usa --init, --ci, init, update, --version o --help"; exit 2 ;;
  esac
fi
