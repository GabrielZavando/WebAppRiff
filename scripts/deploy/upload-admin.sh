#!/usr/bin/env bash
set -euo pipefail

# Despliegue manual del panel de administración Angular (apps/admin) al
# hosting compartido de Tecnoinver por FTPES.
#
# El panel es una SPA pura: el build produce apps/admin/dist/admin/browser/ y
# el hosting sirve esos ficheros estáticos con el contrato LiteSpeed que viaja
# dentro del build (.htaccess).
#
# Ciclo completo en un solo comando:
#   1. validación de las variables de build
#   2. generación del entorno de producción
#   3. build del panel
#   4. verificación del contrato .htaccess
#   5. verificación de los marcadores del bundle
#   6. comprobación de la cuenta FTP (solo lectura)
#   7. publicación por FTPES y verificación posterior
#
# Modo plan por defecto: sin la bandera --publish no se escribe nada en el
# hosting. La publicación es NO destructiva: nunca borra ficheros remotos, de
# modo que las sesiones activas con un index.html cacheado siguen resolviendo
# los bundles con hash de su versión.
#
# La lógica común de validación de secretos y de sesión FTPES vive en
# scripts/deploy/ftp-common.sh, compartida con el carril del sitio público.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/deploy/ftp-common.sh
source "${REPO_ROOT}/scripts/deploy/ftp-common.sh"

PUBLISH_MODE=0
SESSION_DIR=""
DIST_DIR="${REPO_ROOT}/apps/admin/dist/admin/browser"
REQUIRED_BUILD_VARS=(
  FIREBASE_API_KEY
  FIREBASE_AUTH_DOMAIN
  FIREBASE_PROJECT_ID
  FIREBASE_APP_ID
  API_BASE_URL
)

cleanup() {
  if [[ -n "${SESSION_DIR}" ]]; then
    rm -rf "$SESSION_DIR"
  fi
}

trap cleanup EXIT

usage() {
  cat <<'USAGE'
Uso: scripts/deploy/upload-admin.sh [--publish]

Variables de entorno obligatorias (build):
  FIREBASE_API_KEY      Clave web de Firebase del proyecto (riff-catalogo-staging)
  FIREBASE_AUTH_DOMAIN  Dominio de Firebase Authentication
  FIREBASE_PROJECT_ID   Project ID de Firebase
  FIREBASE_APP_ID       App ID web de Firebase
  API_BASE_URL          Base del backend (https://.../api/v1)

Variables de entorno obligatorias (publicación):
  FTP_HOST              Nombre del servidor FTP (nombre del certificado TLS)
  FTP_USER              Usuario FTP
  FTP_PASSWORD          Contraseña FTP
  SMOKE_ADMIN_URL       URL pública del panel (https://admin-staging.somosriff.cl)

Sin banderas el script ejecuta el modo plan: genera el build, pasa todos los
gates, comprueba el acceso en solo lectura e imprime el plan de publicación
sin escribir nada en el hosting. Con --publish sube el build y lo verifica.
USAGE
}

log() {
  printf '[upload-admin] %s\n' "$*"
}

fail() {
  printf '::error::%s\n' "$*" >&2
  exit 1
}

parse_arguments() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --publish)
        PUBLISH_MODE=1
        shift
        ;;
      --help | -h)
        usage
        exit 0
        ;;
      *)
        printf '::error::Opción desconocida: %s\n' "$1" >&2
        usage >&2
        exit 1
        ;;
    esac
  done
}

validate_build_environment() {
  local missing=0
  local name value

  for name in "${REQUIRED_BUILD_VARS[@]}"; do
    value="${!name:-}"
    if [[ -z "$value" ]]; then
      printf '::error::Falta la variable de build %s\n' "$name" >&2
      missing=1
      continue
    fi
    case "$value" in
      dev-placeholder* | bundle-smoke*)
        printf '::error::La variable %s contiene un valor de marcador (%s); no se puede publicar\n' "$name" "$value" >&2
        missing=1
        ;;
    esac
  done

  if [[ $missing -ne 0 ]]; then
    return 1
  fi

  case "${API_BASE_URL}" in
    https://*) ;;
    *)
      printf '::error::API_BASE_URL debe usar el esquema https:// (la CSP del panel solo permite conexiones https)\n' >&2
      return 1
      ;;
  esac

  case "${API_BASE_URL}" in
    *localhost* | *127.0.0.1*)
      printf '::error::API_BASE_URL no puede apuntar a localhost en una publicación\n' >&2
      return 1
      ;;
  esac

  return 0
}

generate_production_environment() {
  (cd "${REPO_ROOT}/apps/admin" && node scripts/write-env.mjs --target=prod)
}

build_admin_panel() {
  (cd "${REPO_ROOT}" && npm run build --workspace=@riff/admin)
}

verify_build_contract() {
  (cd "${REPO_ROOT}" && npm run verify:htaccess --workspace=@riff/admin)
}

verify_bundle_markers() {
  (cd "${REPO_ROOT}" && npm run check:bundle --workspace=@riff/admin)
}

write_admin_command_file() {
  local commands_file="${1:?Falta el fichero de comandos de lftp}"
  local dist_dir="${2:?Falta el directorio de build del panel}"
  local hashed_files=()
  local file base

  {
    echo "# phase 1: content-hashed immutable assets"
    shopt -s nullglob
    hashed_files=("${dist_dir}"/chunk-*.js "${dist_dir}"/main-*.js "${dist_dir}"/styles-*.css)
    shopt -u nullglob
    if [[ ${#hashed_files[@]} -gt 0 ]]; then
      for file in "${hashed_files[@]}"; do
        base="$(basename "$file")"
        printf 'put "%s" -o %s\n' "$file" "$base"
      done
    fi
    if [[ -d "${dist_dir}/media" ]]; then
      printf 'mirror -R "%s/media" /media\n' "$dist_dir"
    fi

    echo "# phase 2: non-hashed static assets"
    if [[ -d "${dist_dir}/assets" ]]; then
      printf 'mirror -R "%s/assets" /assets\n' "$dist_dir"
    fi
    if [[ -f "${dist_dir}/logo_riff.png" ]]; then
      printf 'put "%s/logo_riff.png" -o logo_riff.png\n' "$dist_dir"
    fi

    echo "# phase 3: LiteSpeed contract"
    printf 'put "%s/.htaccess" -o .htaccess\n' "$dist_dir"

    echo "# phase 4: SPA bootstrap (uploaded last)"
    printf 'put "%s/index.html" -o index.html\n' "$dist_dir"
  } >> "$commands_file"
}

list_remote_root() {
  local commands_file="${SESSION_DIR}/lftp-list-commands"

  ftp_write_session_prelude "$commands_file"
  ftp_write_session_open "$commands_file"
  echo 'cls -la' >> "$commands_file"

  ftp_run_session "$commands_file" "$SESSION_DIR"
}

assert_admin_hosting_account() {
  local listing="${1:?Falta el listado remoto}"

  if [[ "$listing" == *"_astro"* ]]; then
    fail "La raíz remota contiene '_astro/': esta es la cuenta del sitio público. El panel admin necesita su propia cuenta y carpeta raíz FTP (admin-staging.somosriff.cl)."
  fi

  if [[ "$listing" == *"404.html"* ]]; then
    fail "La raíz remota contiene '404.html': esta es la cuenta del sitio público. El panel admin necesita su propia cuenta y carpeta raíz FTP (admin-staging.somosriff.cl)."
  fi
}

first_content_hashed_asset() {
  local candidates=()

  shopt -s nullglob
  candidates=("${DIST_DIR}"/main-*.js "${DIST_DIR}"/chunk-*.js)
  shopt -u nullglob

  if [[ ${#candidates[@]} -eq 0 ]]; then
    fail "El build no contiene bundles con hash para verificar en ${DIST_DIR}"
  fi

  printf '%s\n' "${candidates[0]}"
}

check_http_status() {
  local url="${1:?Falta la URL a comprobar}"
  local expected="${2:?Falta el estado HTTP esperado}"
  local label="${3:?Falta la etiqueta de la comprobación}"
  local status

  status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "$url" || true)"
  if [[ "$status" != "$expected" ]]; then
    fail "La comprobación HTTP de ${label} falló: ${url} devolvió ${status} (se esperaba ${expected})"
  fi
  log "OK ${label}: HTTP ${status}"
}

verify_published_panel() {
  local base_url="${SMOKE_ADMIN_URL%/}"
  local asset_name

  log "Ejecutando el smoke del panel (scripts/smoke/admin.mjs)"
  if ! (cd "${REPO_ROOT}" && SMOKE_ADMIN_URL="$base_url" node scripts/smoke/admin.mjs); then
    fail "El smoke del panel admin falló tras la publicación (${base_url})"
  fi

  asset_name="$(basename "$(first_content_hashed_asset)")"

  check_http_status "${base_url}/" 200 "la raíz del panel"
  check_http_status "${base_url}/products" 200 "la ruta profunda /products"
  check_http_status "${base_url}/${asset_name}" 200 "el asset ${asset_name}"
}

publish_to_hosting() {
  local commands_file="${SESSION_DIR}/lftp-commands"

  ftp_write_session_prelude "$commands_file"
  ftp_write_session_open "$commands_file"
  write_admin_command_file "$commands_file" "$DIST_DIR"

  log "Subiendo el build por FTPES (fase 1 assets con hash → fase 2 estáticos → fase 3 .htaccess → fase 4 index.html)"
  ftp_run_session "$commands_file" "$SESSION_DIR"
}

print_publication_plan() {
  local commands_file="${SESSION_DIR}/lftp-commands"

  ftp_write_session_prelude "$commands_file"
  ftp_write_session_open "$commands_file"
  write_admin_command_file "$commands_file" "$DIST_DIR"

  echo
  echo "Plan de publicación (no se escribe nada en el hosting):"
  echo "  1. phase 1: content-hashed immutable assets (chunk-*.js, main-*.js, styles-*.css, media/)"
  echo "  2. phase 2: non-hashed static assets (assets/, logo_riff.png)"
  echo "  3. phase 3: LiteSpeed contract (.htaccess)"
  echo "  4. phase 4: SPA bootstrap (index.html) — uploaded last"
  echo
  echo "Fichero de comandos de lftp:"
  cat "$commands_file"
  echo
}

main() {
  parse_arguments "$@"

  validate_build_environment || exit 1

  if ! ftp_require_secrets "el entorno del despliegue"; then
    exit 1
  fi

  if ! command -v lftp > /dev/null 2>&1; then
    fail "lftp no está instalado en esta máquina (apt-get install -y lftp)"
  fi

  log "Generando el entorno de producción"
  generate_production_environment

  log "Compilando el panel admin"
  build_admin_panel

  log "Verificando el contrato .htaccess contra el build"
  verify_build_contract

  log "Verificando los marcadores del bundle"
  verify_bundle_markers

  SESSION_DIR="$(mktemp -d)"

  log "Comprobando el acceso al hosting (solo lectura)"
  assert_admin_hosting_account "$(list_remote_root)"

  if [[ "$PUBLISH_MODE" -eq 1 ]]; then
    if [[ -z "${SMOKE_ADMIN_URL:-}" ]]; then
      fail "Falta la variable SMOKE_ADMIN_URL (URL pública del panel admin) para publicar"
    fi
    publish_to_hosting
    verify_published_panel
    log "Publicación completada correctamente"
  else
    print_publication_plan
    log "Modo plan: no se ha escrito nada en el hosting. Usa --publish para publicar."
  fi
}

main "$@"
