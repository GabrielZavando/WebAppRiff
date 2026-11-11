#!/usr/bin/env bash
set -euo pipefail

missing=0
for secret_name in FTP_HOST FTP_USER FTP_PASSWORD; do
  if [[ -z "${!secret_name:-}" ]]; then
    echo "::error::Falta el secret ${secret_name} en el GitHub Environment 'staging'" >&2
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

session_dir="$(mktemp -d)"
trap 'rm -rf "$session_dir"' EXIT

install -m 600 /dev/null "$session_dir/.netrc"
printf 'machine %s\nlogin %s\npassword %s\n' "$FTP_HOST" "$FTP_USER" "$FTP_PASSWORD" > "$session_dir/.netrc"

printf '%s\n' \
  'set ftp:ssl-allow no' \
  'set ftp:ssl-force yes' \
  'set ftp:ssl-protect-data yes' \
  'set ftp:port 21' \
  'set ftp:passive-mode yes' \
  'set net:max-retries 3' \
  'set net:timeout 30' \
  'set net:max-idle 30' \
  'set cmd:fail-exit yes' \
  "open ftp://${FTP_HOST}" \
  'cls -la' > "$session_dir/commands"

HOME="$session_dir" lftp -f "$session_dir/commands"
