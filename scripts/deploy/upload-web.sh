#!/usr/bin/env bash
set -euo pipefail

# Sube el build del sitio público al hosting compartido por FTPES.
#
# La lógica común de validación de secretos y de sesión FTPES vive en
# scripts/deploy/ftp-common.sh, compartida con el carril del panel admin.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/deploy/ftp-common.sh
source "${script_dir}/ftp-common.sh"

if ! ftp_require_secrets; then
  exit 1
fi

dist_dir="${1:?Falta la ruta del directorio dist (primer argumento)}"
part="${2:?Falta la parte a subir (_astro o rest) (segundo argumento)}"

if [[ ! -d "$dist_dir" ]]; then
  echo "::error::El directorio de build no existe: $dist_dir" >&2
  exit 1
fi

session_dir="$(mktemp -d)"
trap 'rm -rf "$session_dir"' EXIT

commands_file="$session_dir/lftp-commands"
ftp_write_session_prelude "$commands_file"
ftp_write_session_open "$commands_file"
if [[ "$part" == "_astro" ]]; then
  echo "mirror -R \"${dist_dir}/_astro\" /_astro" >> "$commands_file"
else
  echo "mirror -R --exclude-glob _astro \"${dist_dir}\" /" >> "$commands_file"
fi

ftp_run_session "$commands_file" "$session_dir"
