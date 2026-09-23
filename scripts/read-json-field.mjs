#!/usr/bin/env node
// read-json-field.mjs — SPECBOOT-PERM-01 (change agent-permission-contracts)
//
// Helper fijo y de SOLO LECTURA para que los agentes lean campos JSON sin
// necesitar `node -e *` (que permitiría JavaScript arbitrario con escritura).
//
// Uso:
//   node scripts/read-json-field.mjs <archivo-json> <campo>
//
// Contrato (REQ-006):
//   - Allowlist CERRADA y hardcodeada: solo lee archivos y campos
//     autorizados abajo; cualquier otra ruta/campo termina con error.
//   - No acepta rutas arbitrarias del llamador (solo rutas relativas dentro
//     del proyecto que coincidan exactamente con la allowlist).
//   - Nunca escribe: único acceso a disco es fs.readFileSync.
//   - Exit 1 + mensaje a stderr ante archivo/campo no autorizado o inválido.
//
// Este helper se instala en proyectos consumidores vía `specboot init` /
// `specboot update` (los agentes del proyecto lo invocan directamente).

import fs from 'node:fs';

// Allowlist cerrada: archivo relativo → campos leíbles.
const ALLOWED = {
  'openspec/state/verify-results.json': new Set([
    'verdict', 'status', 'change', 'ticket', 'ticketId', 'timestamp', 'summary',
  ]),
  'openspec/state/adversarial-result.json': new Set([
    'verdict', 'change', 'ticket', 'ticketId', 'timestamp', 'findings',
  ]),
  'openspec/state/manifest.json': new Set(['changes', 'entries', 'version']),
  '.specboot.json': new Set([
    'frameworkVersion', 'services', 'layers', 'stalenessPaths',
  ]),
};

function fail(msg) {
  console.error(`read-json-field: ${msg}`);
  process.exit(1);
}

const [file, field] = process.argv.slice(2);
if (!file || !field) fail('uso: node scripts/read-json-field.mjs <archivo-json> <campo>');

if (!Object.prototype.hasOwnProperty.call(ALLOWED, file)) {
  fail(`archivo no autorizado (fuera de la allowlist): ${file}`);
}
if (!ALLOWED[file].has(field)) {
  fail(`campo no autorizado en ${file}: ${field}`);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (e) {
  fail(`no se pudo leer/parsear ${file} (${e.message})`);
}

if (!(field in data)) fail(`campo ausente en ${file}: ${field}`);
const value = data[field];
process.stdout.write(typeof value === 'object' ? JSON.stringify(value) : String(value));
process.stdout.write('\n');
