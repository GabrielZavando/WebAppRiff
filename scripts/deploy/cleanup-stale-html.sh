#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# cleanup-stale-html.sh
#
# Borra documentos HTML obsoletos del hosting FTPES tras una publicación
# exitosa, de forma acotada y protegida por guardas.
#
# Uso:
#   cleanup-stale-html.sh <dist_dir> <cleanup_mode>
#
#   dist_dir      ruta al directorio dist/ local (p. ej. apps/web/dist)
#   cleanup_mode  dry-run | ejecutar  (por defecto: dry-run)
#
# En modo dry-run solo lista lo que borraría (no borra nada).
# En modo ejecutar borra tras registrar la lista y pasar las guardas.
#
# Salida:
#   - registro en stdout y en $GITHUB_STEP_SUMMARY (cuando existe)
#   - salida 0 si todo OK o nada que borrar
#   - salida 1 si una guarda falla (sin borrar nada) o error de conexión
###############################################################################

dist_dir="${1:?Falta la ruta del directorio dist (primer argumento)}"
cleanup_mode="${2:-dry-run}"

if [[ "$cleanup_mode" != "dry-run" && "$cleanup_mode" != "ejecutar" ]]; then
  echo "::error::Modo de limpieza inválido: $cleanup_mode (usa 'dry-run' o 'ejecutar')" >&2
  exit 1
fi

if [[ ! -d "$dist_dir" ]]; then
  echo "::error::El directorio de build no existe: $dist_dir" >&2
  exit 1
fi

###############################################################################
# 1. Validar secretos sin imprimir nunca sus valores
###############################################################################
missing=0
for secret_name in FTP_HOST FTP_USER FTP_PASSWORD; do
  value="${!secret_name:-}"
  if [[ -z "$value" ]]; then
    echo "::error::Falta el secret ${secret_name} en el GitHub Environment 'staging'" >&2
    missing=1
    continue
  fi
  case "$value" in
    *[![:print:][:space:]]*)
      echo "::error::El secret ${secret_name} contiene caracteres de control" >&2
      missing=1
      ;;
    [[:space:]]* | *[[:space:]])
      echo "::error::El secret ${secret_name} tiene espacios o saltos de línea al principio o al final" >&2
      missing=1
      ;;
  esac
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

###############################################################################
# 2. Guardas previas sobre el build local (sin tocar el hosting)
###############################################################################
summary_file="${GITHUB_STEP_SUMMARY:-/dev/null}"
abort() {
  local motivo="$1"
  {
    echo "### Limpieza de HTML obsoleto — abortada"
    echo ""
    echo "Motivo: ${motivo}"
    echo ""
    echo "No se ha borrado ningún fichero del hosting."
  } >> "$summary_file"
  echo "::error::${motivo}" >&2
  exit 1
}

if [[ ! -f "$dist_dir/index.html" ]]; then
  abort "Falta dist/index.html en el build (guarda de build mínimo incumplida)"
fi

if [[ ! -f "$dist_dir/404.html" ]]; then
  abort "Falta dist/404.html en el build (guarda de build mínimo incumplida)"
fi

local_html_count="$(find "$dist_dir" -type f -name '*.html' | wc -l)"
if [[ "$local_html_count" -lt 5 ]]; then
  abort "El build solo tiene ${local_html_count} documentos HTML (mínimo razonable: 5); posible build truncado"
fi

###############################################################################
# 3. Calcular directorios candidatos (raíz + directorios presentes en dist/)
###############################################################################
candidate_dirs_file="$(mktemp)"
trap 'rm -rf "$candidate_dirs_file"' EXIT

# La raíz del sitio es candidata.
echo "/" > "$candidate_dirs_file"

# Los subdirectorios de dist/ que contienen al menos un .html son candidatos.
while IFS= read -r -d '' html_file; do
  rel_path="${html_file#$dist_dir/}"
  dir_part="$(dirname "$rel_path")"
  if [[ "$dir_part" != "." ]]; then
    dir_candidate="/${dir_part}/"
    case "$dir_candidate" in
      /.well-known/*|/.well-known|/cgi-bin/*|/cgi-bin) continue ;;
    esac
    echo "$dir_candidate"
  fi
done < <(find "$dist_dir" -type f -name '*.html' -print0) | sort -u >> "$candidate_dirs_file"

###############################################################################
# 4. Listar documentos HTML remotos en los directorios candidatos
###############################################################################
session_dir="$(mktemp -d)"
trap 'rm -rf "$session_dir" "$candidate_dirs_file"' EXIT

remote_html_file="$(mktemp)"
trap 'rm -rf "$session_dir" "$candidate_dirs_file" "$remote_html_file"' EXIT

{
  echo 'set ftp:ssl-allow yes'
  echo 'set ftp:ssl-force yes'
  echo 'set ftp:ssl-protect-data yes'
  echo 'set ftp:passive-mode yes'
  echo 'set ftp:port 21'
  echo 'set net:max-retries 3'
  echo 'set net:timeout 30'
  echo 'set net:idle 30'
  echo 'set cmd:fail-exit yes'
  printf 'open -u "%s" --env-password ftp://%s\n' "$FTP_USER" "$FTP_HOST"
  while IFS= read -r dir; do
    [[ -z "$dir" ]] && continue
    echo "echo \"===DIR ${dir}===\""
    echo "cls -1 -a \"${dir}\""
    echo "echo \"===END ${dir}===\""
  done < "$candidate_dirs_file"
  echo "bye"
} > "$session_dir/lftp-commands"

export LFTP_PASSWORD="$FTP_PASSWORD"

HOME="$session_dir" lftp -f "$session_dir/lftp-commands" > "$session_dir/lftp-output" 2>&1

###############################################################################
# 5. Parsear salida y calcular ficheros a borrar
###############################################################################
local_html_set="$(mktemp)"
trap 'rm -rf "$session_dir" "$candidate_dirs_file" "$remote_html_file" "$local_html_set"' EXIT

while IFS= read -r -d '' html_file; do
  rel_path="${html_file#$dist_dir/}"
  dir_part="$(dirname "$rel_path")"
  base_name="$(basename "$rel_path")"
  if [[ "$dir_part" == "." ]]; then
    echo "/${base_name}"
  else
    echo "/${dir_part}/${base_name}"
  fi
done < <(find "$dist_dir" -type f -name '*.html' -print0) | sort -u > "$local_html_set"

in_block=0
current_dir=""
while IFS= read -r line; do
  if [[ "$line" =~ ^\=\=\=DIR\ (.+)\=\=\=$ ]]; then
    current_dir="${BASH_REMATCH[1]}"
    in_block=1
    continue
  fi
  if [[ "$line" =~ ^\=\=\=END\ (.+)\=\=\=$ ]]; then
    in_block=0
    current_dir=""
    continue
  fi
  if [[ "$in_block" -eq 1 && "$line" == *.html ]]; then
    echo "${current_dir}${line}"
  fi
done < "$session_dir/lftp-output" | sort -u > "$remote_html_file"

to_delete_file="$(mktemp)"
trap 'rm -rf "$session_dir" "$candidate_dirs_file" "$remote_html_file" "$local_html_set" "$to_delete_file"' EXIT

while IFS= read -r remote_file; do
  if ! grep -qxF "$remote_file" "$local_html_set"; then
    echo "$remote_file"
  fi
done < "$remote_html_file" | sort -u > "$to_delete_file"

to_delete_count="$(wc -l < "$to_delete_file" | tr -d ' ')"

###############################################################################
# 6. Guardas de volumen
###############################################################################
remote_html_count="$(wc -l < "$remote_html_file" | tr -d ' ')"

if [[ "$to_delete_count" -gt 100 ]]; then
  {
    echo "### Limpieza de HTML obsoleto — abortada por umbral absoluto"
    echo ""
    echo "Se iban a borrar ${to_delete_count} documentos HTML (máximo permitido: 100)."
    echo "No se ha borrado ningún fichero del hosting."
  } >> "$summary_file"
  echo "::error::Se iban a borrar ${to_delete_count} documentos HTML (máximo permitido: 100). Limpieza abortada." >&2
  exit 1
fi

if [[ "$remote_html_count" -gt 0 ]]; then
  delete_pct="$(( to_delete_count * 100 / remote_html_count ))"
  if [[ "$delete_pct" -gt 100 ]]; then
    {
      echo "### Limpieza de HTML obsoleto — abortada por umbral relativo"
      echo ""
      echo "Se iban a borrar ${to_delete_count} de ${remote_html_count} documentos HTML remotos (${delete_pct}%, máximo permitido: 100%)."
      echo "No se ha borrado ningún fichero del hosting."
    } >> "$summary_file"
    echo "::error::Se iban a borrar ${delete_pct}% de los documentos HTML remotos (máximo permitido: 100%). Limpieza abortada." >&2
    exit 1
  fi
fi

###############################################################################
# 7. Registrar lista de rutas antes de borrar (trazabilidad)
###############################################################################
{
  echo "### Limpieza de HTML obsoleto — modo ${cleanup_mode}"
  echo ""
  echo "Documentos HTML remotos candidatos a borrar: ${to_delete_count}"
  echo ""
  if [[ "$to_delete_count" -gt 0 ]]; then
    echo "Rutas que se eliminarán:"
    echo ""
    while IFS= read -r path; do
      echo "- \`${path}\`"
    done < "$to_delete_file"
    echo ""
  else
    echo "No hay documentos HTML obsoletos que borrar."
    echo ""
  fi
} >> "$summary_file"

if [[ "$cleanup_mode" == "dry-run" ]]; then
  echo "Modo dry-run: se listaron ${to_delete_count} rutas para borrar, pero no se ha borrado nada."
  exit 0
fi

###############################################################################
# 8. Ejecutar borrado (solo modo ejecutar)
###############################################################################
if [[ "$to_delete_count" -eq 0 ]]; then
  echo "No hay documentos HTML obsoletos que borrar."
  exit 0
fi

delete_commands_file="$(mktemp)"
trap 'rm -rf "$session_dir" "$candidate_dirs_file" "$remote_html_file" "$local_html_set" "$to_delete_file" "$delete_commands_file"' EXIT

{
  echo 'set ftp:ssl-allow yes'
  echo 'set ftp:ssl-force yes'
  echo 'set ftp:ssl-protect-data yes'
  echo 'set ftp:passive-mode yes'
  echo 'set ftp:port 21'
  echo 'set net:max-retries 3'
  echo 'set net:timeout 30'
  echo 'set net:idle 30'
  echo 'set cmd:fail-exit yes'
  printf 'open -u "%s" --env-password ftp://%s\n' "$FTP_USER" "$FTP_HOST"
  while IFS= read -r path; do
    echo "rm \"${path}\""
  done < "$to_delete_file"
  echo "bye"
} > "$delete_commands_file"

HOME="$session_dir" lftp -f "$delete_commands_file" > "$session_dir/lftp-delete-output" 2>&1

{
  echo ""
  echo "Borrado completado: ${to_delete_count} documento(s) HTML eliminado(s) del hosting."
} >> "$summary_file"

echo "Limpieza completada: ${to_delete_count} documento(s) HTML borrado(s)."
