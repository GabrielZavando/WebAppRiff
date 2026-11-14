#!/usr/bin/env bash
# Shared FTPES helpers for the publication lanes of the shared hosting.
#
# Sourced by scripts/deploy/upload-web.sh (public site) and
# scripts/deploy/upload-admin.sh (admin panel). It owns:
# - the validation of the FTP credentials (never printed);
# - the lftp session profile (forced TLS, passive mode, dotfiles);
# - the execution of the session with a temporary HOME.
#
# The credentials are read from the environment: FTP_HOST, FTP_USER and
# FTP_PASSWORD. The password is handed to lftp through LFTP_PASSWORD and
# --env-password, never through a credentials file nor a printed command.
#
# This file is sourced, never executed: it defines functions only.

# Validates the FTP credentials. Returns 1 when at least one secret is
# missing or malformed. The values are never printed.
#
# Usage: ftp_require_secrets [context-label]
# The context label names where the secrets come from, so each lane reports
# the right source without changing the validation itself.
ftp_require_secrets() {
  local context="${1:-GitHub Environment 'staging'}"
  local missing=0
  local secret_name value

  for secret_name in FTP_HOST FTP_USER FTP_PASSWORD; do
    value="${!secret_name:-}"
    if [[ -z "$value" ]]; then
      echo "::error::Falta el secret ${secret_name} en ${context}" >&2
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

  return "$missing"
}

# Writes the lftp session profile into the command file.
# Usage: ftp_write_session_prelude <commands-file>
ftp_write_session_prelude() {
  local commands_file="${1:?Falta el fichero de comandos de lftp}"

  {
    echo 'set ftp:ssl-allow yes'
    echo 'set ftp:ssl-force yes'
    echo 'set ftp:ssl-protect-data yes'
    echo 'set ftp:passive-mode yes'
    echo 'set ftp:port 21'
    echo 'set glob:dot 1'
    echo 'set net:max-retries 3'
    echo 'set net:timeout 30'
    echo 'set net:idle 30'
    echo 'set cmd:fail-exit yes'
  } > "$commands_file"
}

# Writes the authenticated connection into the command file.
# The password is never written: lftp reads it from LFTP_PASSWORD.
# Usage: ftp_write_session_open <commands-file>
ftp_write_session_open() {
  local commands_file="${1:?Falta el fichero de comandos de lftp}"

  printf 'open -u "%s" --env-password ftp://%s\n' "$FTP_USER" "$FTP_HOST" >> "$commands_file"
}

# Runs the session with a temporary HOME so the operator's ~/.lftprc is never
# read nor written.
# Usage: ftp_run_session <commands-file> <session-dir>
ftp_run_session() {
  local commands_file="${1:?Falta el fichero de comandos de lftp}"
  local session_dir="${2:?Falta el directorio temporal de sesión}"

  export LFTP_PASSWORD="$FTP_PASSWORD"

  HOME="$session_dir" lftp -f "$commands_file"
}
