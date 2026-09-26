#!/usr/bin/env bash
# release-bump.sh — Atomic framework version bump (TICKET-AUDIT-3; contract
# corrected per SPECBOOT-HARDEN-04 / REQ-006).
#
# Updates ALL version sources in ONE atomic operation — every file is parsed
# and validated BEFORE anything is written, so a failure leaves no partially
# updated versions:
#   package.json      → "version": X.Y.Z
#   package-lock.json → root "version": X.Y.Z AND packages[""].version: X.Y.Z
#                        (skipped with a note when the file does not exist;
#                        a corrupted lock aborts the bump without writes)
#   .specboot.json    → "frameworkVersion": X.Y.Z
#
# Preconditions (aborts with exit 1, writing nothing):
#   - argument must be a valid semver X.Y.Z (optional -suffix allowed)
#   - CHANGELOG.md must contain a `## [X.Y.Z]` section
#
# The script operates on the CURRENT WORKING DIRECTORY (run it from the repo
# root). It NEVER creates git tags and NEVER commits: tag creation belongs to
# the maintainer's POST-MERGE phase — after merging to main (with the local
# main updated), the tag v{X.Y.Z} is created pointing exactly at the main
# commit that contains the bump, and pushed only with explicit authorization
# (see docs/versioning-standard.md, "Política de tags"). Committing belongs
# to /commit.
#
# Usage: bash release-bump.sh 0.9.0

set -euo pipefail

VERSION="${1:-}"

err() { echo "❌ release-bump: $1" >&2; exit 1; }

# --- Precondition 1: valid semver ---
if [ -z "$VERSION" ]; then
  err "usage: bash release-bump.sh <semver>  (e.g. 0.9.0)"
fi
if ! echo "$VERSION" | grep -qE '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'; then
  err "'$VERSION' is not a valid semver (expected X.Y.Z or X.Y.Z-suffix)"
fi

# --- Precondition 2: files exist ---
[ -f package.json ]   || err "package.json not found in $(pwd)"
[ -f .specboot.json ] || err ".specboot.json not found in $(pwd)"
[ -f CHANGELOG.md ]   || err "CHANGELOG.md not found in $(pwd)"

# --- Precondition 3: CHANGELOG documents this version (fixed-string match) ---
if ! grep -qF "## [$VERSION]" CHANGELOG.md; then
  err "CHANGELOG.md has no '## [$VERSION]' section — write the changelog entry first"
fi

# --- Atomic bump: parse AND validate ALL version files BEFORE writing anything ---
node -e "
const fs = require('fs');
const v = process.argv[1];

// 1. Read + parse ALL version sources first: any failure here (e.g. a
//    corrupted package-lock.json) leaves the tree untouched.
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const boot = JSON.parse(fs.readFileSync('.specboot.json', 'utf8'));
let lock = null;
if (fs.existsSync('package-lock.json')) {
  lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
}

// 2. Reject downgrades/no-ops: target must be strictly greater (semver compare).
const cmp = (a, b) => {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  return 0;
};
if (cmp(v, pkg.version) <= 0)
  throw new Error(\`target \${v} is not greater than current \${pkg.version} — downgrades are not allowed\`);

// 3. Only now write, all files in the same validated run.
pkg.version = v;
boot.frameworkVersion = v;
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync('.specboot.json', JSON.stringify(boot, null, 2) + '\n');
console.log('package.json → ' + v);
console.log('.specboot.json → frameworkVersion ' + v);

// 4. Lockfile sync (same validated run): root version + packages[\"\"] entry.
if (lock) {
  lock.version = v;
  if (lock.packages && Object.prototype.hasOwnProperty.call(lock.packages, '')) {
    lock.packages[''].version = v;
  }
  fs.writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
  console.log('package-lock.json → ' + v);
} else {
  console.log('ℹ package-lock.json not found — skipped (bump continues without lock)');
}
" "$VERSION" || err "bump aborted: $VERSION not applied (see error above)"

echo "✅ Bump complete: $VERSION (committing belongs to /commit; the tag belongs to the post-merge phase)"
