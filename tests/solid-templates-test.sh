#!/usr/bin/env bash
# tests/solid-templates-test.sh
#
# Validates the SOLID/POO CI templates produced by Ticket 4 — WITHOUT installing
# npm/eslint/dependency-cruiser (impossible in the Metadoc template which carries
# no application code).
#
# This is meta-validation only: checks that the template files exist, contain
# the correct numeric thresholds that match docs/backend-standards.md and
# docs/frontend-standards.md (Ticket 1), carry explicit SOLID comments, and that
# ci.yml contains a properly conditioned `solid-lint` job.
#
# Run:  bash tests/solid-templates-test.sh
# Exit: 0 success, 1 on any check failure.

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TPL="$ROOT/templates/ci"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
PASS() { echo -e "  ${GREEN}✓${NC} $1"; }
FAIL() { echo -e "  ${RED}✗${NC} $1"; ERRORS=$((ERRORS + 1)); }
WARN() { echo -e "  ${YELLOW}⚠${NC} $1"; }

echo "🔍 SOLID templates meta-validation (Ticket 4)"
echo "================================"
echo ""

# ---- Check 1: Template files exist ----
echo "→ Check 1: Template files exist"
for f in \
  "README.md" \
  "package.ci.json" \
  "eslintrc.backend.js" \
  "eslintrc.frontend.js" \
  "eslintrc.astro.js" \
  ".dependency-cruiser.js" \
  ".madge.config.json"; do
  if [ -f "$TPL/$f" ]; then PASS "$f"; else FAIL "missing: $TPL/$f"; fi
done
echo ""

# ---- Check 2: Backend ESLint has the exact Ticket 1 thresholds ----
echo "→ Check 2: eslintrc.backend.js has correct Ticket 1 thresholds"
B="$TPL/eslintrc.backend.js"
if grep -q "'max-lines': \['error', { max: 300" "$B"; then PASS "max-lines = 300 (Backend L85)"; else FAIL "max-lines missing or wrong value"; fi
if grep -q "'complexity': \['error', 10\]" "$B"; then PASS "complexity = 10 cyclomatic (Backend L86)"; else FAIL "complexity missing"; fi
if grep -q "'sonarjs/cognitive-complexity': \['error', 10\]" "$B"; then PASS "sonarjs/cognitive-complexity = 10"; else FAIL "cognitive-complexity missing"; fi
echo ""

# ---- Check 3: Frontend ESLint has the exact Ticket 1 Angular threshold ----
echo "→ Check 3: eslintrc.frontend.js has correct Ticket 1 Angular threshold"
F="$TPL/eslintrc.frontend.js"
if grep -q "'max-lines': \['error', { max: 400" "$F"; then PASS "max-lines = 400 (Frontend L61)"; else FAIL "max-lines missing"; fi
if grep -q "'@angular-eslint/component-class-size': \['error', { maxLineCount: 400 }" "$F"; then PASS "component-class-size = 400"; else FAIL "component-class-size missing"; fi
echo ""

# ---- Check 4: Astro ESLint uses 'warn' (honest: Ticket 1 has no Astro number) ----
echo "→ Check 4: eslintrc.astro.js uses 'warn' (Ticket 1 has no Astro threshold)"
A="$TPL/eslintrc.astro.js"
if grep -q "'max-lines': \['warn'" "$A"; then PASS "max-lines uses 'warn' (honest discrepancy marker)"; else FAIL "expected 'warn' but found otherwise"; fi
echo ""

# ---- Check 5: dependency-cruiser has authoritative DIP rule ----
echo "→ Check 5: .dependency-cruiser.js has authoritative DIP rules"
DC="$TPL/.dependency-cruiser.js"
if grep -q "no-infra-from-domain" "$DC"; then PASS "rule 'no-infra-from-domain' present"; else FAIL "missing DIP rule 'no-infra-from-domain'"; fi
if grep -q "no-orm-or-http-from-domain" "$DC"; then PASS "rule 'no-orm-or-http-from-domain' present"; else FAIL "missing DIP rule 'no-orm-or-http-from-domain'"; fi
if grep -q "SOLID: DIP" "$DC"; then PASS "SOLID: DIP comments present"; else FAIL "missing 'SOLID: DIP' annotations"; fi
# Must guard the right patterns: typeorm, prisma, mongoose, axios, @nestjs/axios
for pkg in typeorm prisma mongoose axios; do
  if grep -q "$pkg" "$DC"; then PASS "guards $pkg"; else FAIL "does not guard $pkg"; fi
done
if grep -q "@nestjs/axios" "$DC"; then PASS "guards @nestjs/axios"; else FAIL "does not guard @nestjs/axios"; fi
echo ""

# ---- Check 6: SOLID comments present in each config ----
echo "→ Check 6: SOLID comments present in each config"
for f in "eslintrc.backend.js" "eslintrc.frontend.js" "eslintrc.astro.js" ".dependency-cruiser.js"; do
  if grep -q "SOLID:" "$TPL/$f"; then PASS "$f has SOLID: comment"; else FAIL "$f missing SOLID: comment"; fi
done
echo ""

# ---- Check 7: ci.yml has conditioned 'solid-lint' job ----
echo "→ Check 7: ci.yml has conditioned 'solid-lint' job"
CI="$ROOT/.github/workflows/ci.yml"
if [ -f "$CI" ]; then
  if grep -q "^  solid-lint:" "$CI"; then PASS "job 'solid-lint' defined"; else FAIL "missing job 'solid-lint'"; fi
  if grep -q "if: hashFiles('package.json') != ''" "$CI"; then PASS "job conditioned on package.json existence (Metadoc safety)"; else FAIL "missing condition on package.json"; fi
else
  FAIL "ci.yml not found"
fi
echo ""

# ---- Check 8: made config exists for Angular ----
echo "→ Check 8: .madge.config.json exists (auxiliary, Angular)"
if [ -f "$TPL/.madge.config.json" ]; then
  if grep -q "circular" "$TPL/.madge.config.json"; then PASS "circular-dep detection enabled"; else FAIL "circular not set"; fi
else
  FAIL ".madge.config.json missing"
fi
echo ""

# ---- Check 9: ci.yml has deferred Python note ----
echo "→ Check 9: ci.yml has deferred Python/Django note"
if grep -q "import-linter" "$CI"; then PASS "Python deferred note mentions import-linter"; else FAIL "missing Python deferred note"; fi
if grep -q "ruff" "$CI"; then PASS "Python deferred note mentions ruff"; else FAIL "missing ruff mention"; fi
echo ""

# ---- Check 10: docs/ci-standards.md exists and references templates ----
echo "→ Check 10: docs/ci-standards.md exists and references templates"
STD="$ROOT/docs/ci-standards.md"
if [ -f "$STD" ]; then
  PASS "docs/ci-standards.md exists"
  if grep -q "templates/ci/" "$STD"; then PASS "references templates/ci/"; else FAIL "does not reference templates/ci/"; fi
  if grep -q " discrepancies" "$STD" || grep -q "Discrepancias" "$STD"; then PASS "documents honest discrepancies section"; else FAIL "missing discrepancies section"; fi
else
  FAIL "docs/ci-standards.md missing"
fi
echo ""

echo "================================"
echo "📊 Summary"
echo "================================"
if [ "$ERRORS" -gt 0 ]; then
  echo -e "  ${RED}Errors: $ERRORS${NC}"
  echo -e "${RED}❌ SOLID templates meta-validation FAILED${NC}"
  exit 1
else
  echo -e "  ${GREEN}All checks passed${NC}"
  echo -e "${GREEN}✅ SOLID templates meta-validation PASSED${NC}"
  exit 0
fi
