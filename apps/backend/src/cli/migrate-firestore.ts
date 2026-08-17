import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  createCollectionReader,
  createCollectionWriter,
  createStorageCopier,
  getFirestoreFor,
  getStorageFor,
  initFirebaseApp,
  ServiceAccountLike,
} from './migrate/firebase-migration.adapter';
import { MigrationDeps, MigrationOptions, runMigration } from './migrate/migrate-firestore.use-case';

const COLLECTIONS = ['categorias', 'subcategorias', 'productos', 'cotizaciones', 'usuarios'];
const EXCLUDE = ['usuarios'];

interface DestinationWeb {
  storageBucket?: string;
}

interface MigrationSecrets {
  destination: ServiceAccountLike;
  destinationWeb?: DestinationWeb;
}

/** Parser mínimo de `.env` (sin dependencias) que carga las variables al process.env. */
function loadEnvFile(filePath: string): void {
  const text = readFileSync(filePath, 'utf-8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  // Origen = apps/backend/.env (proyecto Firebase actual)
  const envPath = resolve(__dirname, '../../.env');
  loadEnvFile(envPath);
  const sourceSa: ServiceAccountLike = {
    projectId: requireEnv('FIREBASE_PROJECT_ID'),
    clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: requireEnv('FIREBASE_PRIVATE_KEY'),
  };

  const secretsPath =
    process.env.MIGRATION_SECRETS_PATH ?? resolve(__dirname, '../../.migration-secrets.json');
  const secrets = JSON.parse(readFileSync(secretsPath, 'utf-8')) as MigrationSecrets;
  const destSa = secrets.destination;

  const sourceApp = initFirebaseApp('MIGRATION_SOURCE', sourceSa);
  const destApp = initFirebaseApp('MIGRATION_DEST', destSa);

  const sourceFs = getFirestoreFor(sourceApp);
  const destFs = getFirestoreFor(destApp);

  const readers = Object.fromEntries(
    COLLECTIONS.map((c) => [c, createCollectionReader(sourceFs, c)]),
  );
  const writers = Object.fromEntries(
    COLLECTIONS.map((c) => [c, createCollectionWriter(destFs, c)]),
  );

  const dryRun = process.argv.includes('--dry-run');

  let storageCopier: MigrationDeps['storageCopier'];
  if (secrets.destinationWeb?.storageBucket) {
    const sourceStorage = getStorageFor(sourceApp);
    const destStorage = getStorageFor(destApp);
    storageCopier = createStorageCopier(sourceStorage, destStorage, secrets.destinationWeb.storageBucket);
  }

  const deps: MigrationDeps = {
    readers,
    writers,
    storageCopier,
    log: (message: string): void => console.log(message),
  };
  const options: MigrationOptions = { collections: COLLECTIONS, exclude: EXCLUDE, dryRun };

  console.log(dryRun ? 'MIGRACIÓN (dry-run)' : 'MIGRACIÓN');
  const report = await runMigration(deps, options);
  console.log(JSON.stringify(report, null, 2));

  if (!dryRun) {
    console.log('Migración completada. Verifica conteos y ejecuta bootstrap:superadmin en destino.');
  }
}

main().catch((error: unknown) => {
  // No exponer secretos (credenciales Firebase) en el log.
  console.error('Migration failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
