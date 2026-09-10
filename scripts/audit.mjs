#!/usr/bin/env node

/**
 * audit.mjs — Blocking npm audit script with suppressions support.
 *
 * Runs `npm audit --audit-level=high --json`, applies suppressions from
 * `npm-audit-suppressions.json`, and exits non-zero if there are unblocked
 * high/critical vulnerabilities.
 *
 * Features:
 * - SC-201: Returns non-zero for high/critical vulns
 * - SC-202: Applies suppressions from JSON file
 * - SC-203: Expires suppressions via revokedAt
 * - SC-204: Soft path for devDependencies (WARNING only)
 * - SC-205: Critical always blocks
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUPPRESSIONS_PATH = path.join(__dirname, '..', 'npm-audit-suppressions.json');
const ROOT_PACKAGE_PATH = path.join(__dirname, '..', 'package.json');

/**
 * Load root package.json devDependencies list.
 * @returns {Promise<Set<string>>} Set of devDependency package names
 */
export async function loadRootDevDependencies() {
  try {
    const content = await fs.readFile(ROOT_PACKAGE_PATH, 'utf-8');
    const pkg = JSON.parse(content);
    return new Set(Object.keys(pkg.devDependencies || {}));
  } catch {
    return new Set();
  }
}

/**
 * Load suppressions from JSON file.
 * @returns {Promise<Array<{id: string, reason: string, revokedAt: string | null}>>}
 */
export async function loadSuppressions() {
  try {
    const content = await fs.readFile(SUPPRESSIONS_PATH, 'utf-8');
    const data = JSON.parse(content);
    return data.suppressions || [];
  } catch {
    return [];
  }
}

/**
 * Check if a suppression is active (not expired).
 * @param {{ revokedAt: string | null }} suppression
 * @returns {boolean}
 */
export function isSuppressionActive(suppression) {
  if (!suppression.revokedAt) return true;
  const revokedDate = new Date(suppression.revokedAt);
  return revokedDate > new Date();
}

/**
 * Run npm audit and return parsed JSON output.
 * @returns {Promise<Object>}
 */
export async function runNpmAudit() {
  try {
    const { stdout } = await execFileAsync('npm', [
      'audit',
      '--audit-level=high',
      '--json',
    ]);
    return JSON.parse(stdout);
  } catch (error) {
    // npm audit exits non-zero when vulns are found, but still outputs JSON
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        throw new Error(`Failed to parse npm audit output: ${error.message}`);
      }
    }
    throw error;
  }
}

/**
 * Analyze vulnerabilities and apply suppressions.
 * @param {Object} auditData - Parsed npm audit JSON output
 * @param {Array} suppressions - Active suppressions
 * @param {Set<string>} devDependencies - Set of devDependency package names
 * @returns {{ blocking: Array, warnings: Array, suppressed: Array }}
 */
export function analyzeVulnerabilities(auditData, suppressions, devDependencies = new Set()) {
  const blocking = [];
  const warnings = [];
  const suppressed = [];

  const vulns = auditData.vulnerabilities || {};

  for (const [name, vuln] of Object.entries(vulns)) {
    const severity = vuln.severity;
    const via = vuln.via || [];

    // Get advisory IDs from via array
    const advisoryIds = via
      .filter((v) => typeof v === 'object')
      .map((v) => v.url || v.title || v.name)
      .filter(Boolean);

    // Check if any advisory is suppressed (match by package name or advisory ID)
    const isSuppressed = suppressions.some(
      (s) => (s.id === name || advisoryIds.includes(s.id)) && isSuppressionActive(s)
    );

    if (isSuppressed) {
      suppressed.push({ name, severity, advisoryIds });
      continue;
    }

    // SC-205: Critical ALWAYS blocks regardless of devDependencies
    if (severity === 'critical') {
      blocking.push({ name, severity, advisoryIds, reason: 'critical always blocks' });
      continue;
    }

    // SC-204: High vulns in devDependencies → WARNING only (soft path)
    if (severity === 'high') {
      const isDevOnly = devDependencies.has(name);
      if (isDevOnly) {
        warnings.push({ name, severity, advisoryIds, reason: 'devDependency — warning only' });
      } else {
        blocking.push({ name, severity, advisoryIds, reason: 'high severity' });
      }
    }
  }

  return { blocking, warnings, suppressed };
}

/**
 * Print formatted summary.
 * @param {{ blocking: Array, warnings: Array, suppressed: Array }} result
 */
export function printSummary(result) {
  console.log('\n🔒 Audit Summary');
  console.log('═'.repeat(50));

  if (result.blocking.length > 0) {
    console.log(`\n❌ BLOCKING (${result.blocking.length} vulnerabilities):`);
    for (const vuln of result.blocking) {
      console.log(`   • ${vuln.name} [${vuln.severity}] — ${vuln.reason}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${result.warnings.length} vulnerabilities):`);
    for (const vuln of result.warnings) {
      console.log(`   • ${vuln.name} [${vuln.severity}] — ${vuln.reason}`);
    }
  }

  if (result.suppressed.length > 0) {
    console.log(`\n🔇 SUPPRESSED (${result.suppressed.length} vulnerabilities):`);
    for (const vuln of result.suppressed) {
      console.log(`   • ${vuln.name} [${vuln.severity}]`);
    }
  }

  console.log('\n' + '═'.repeat(50));

  if (result.blocking.length > 0) {
    console.log('❌ FAIL — Pipeline blocked by unblocked high/critical vulnerabilities');
  } else {
    console.log('✅ PASS — No blocking vulnerabilities found');
  }
}

/**
 * Main function.
 */
export async function main() {
  console.log('🔍 Running npm audit...');

  // Load suppressions
  const suppressions = await loadSuppressions();
  const activeSuppressions = suppressions.filter(isSuppressionActive);
  console.log(`📋 Loaded ${activeSuppressions.length} active suppressions`);

  // Load root devDependencies for SC-204
  const devDependencies = await loadRootDevDependencies();
  console.log(`📦 Loaded ${devDependencies.size} root devDependencies`);

  // Run npm audit
  const auditData = await runNpmAudit();

  // Analyze vulnerabilities
  const result = analyzeVulnerabilities(auditData, activeSuppressions, devDependencies);

  // Print summary
  printSummary(result);

  // Exit with appropriate code
  return result.blocking.length > 0 ? 1 : 0;
}

// Run if executed directly
const isMainModule = process.argv[1] && 
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  main()
    .then((exitCode) => process.exit(exitCode))
    .catch((error) => {
      console.error('❌ Audit script failed:', error.message);
      process.exit(1);
    });
}
