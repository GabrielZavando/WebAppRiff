#!/usr/bin/env bash
set -euo pipefail

# Valida los secrets sin imprimir nunca sus valores.
missing=0
for secret_name in FTP_HOST FTP_USER FTP_PASSWORD; do
  value="${!secret_name:-}"
  if [[ -z "$value" ]]; then
    echo "::error::Falta el secret ${secret_name} en el GitHub Environment 'staging'" >&2
    missing=1
    continue
  fi
  # Rechaza valores vacíos, saltos de línea, espacios al principio o al final,
  # y caracteres de control.
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

session_dir="$(mktemp -d)"
trap 'rm -rf "$session_dir"' EXIT

commands_file="$session_dir/lftp-commands"
{
  echo 'set ftp:ssl-allow yes'
  echo 'set ftp:ssl-force yes'
  echo 'set ftp:ssl-protect-data yes'
  echo 'set ftp:passive-mode yes'
  echo 'set net:max-retries 3'
  echo 'set net:timeout 30'
  echo 'set net:idle 30'
  echo 'set cmd:fail-exit yes'
  printf 'open -u "%s" --env-password ftp://%s\n' "$FTP_USER" "$FTP_HOST"
  echo 'cls -la'
} > "$commands_file"

export LFTP_PASSWORD="$FTP_PASSWORD"

HOME="$session_dir" lftp -f "$commands_file"
