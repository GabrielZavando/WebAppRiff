import type { ServiceAccount } from 'firebase-admin/app';

/**
 * Normaliza la private key de un service account de Firebase.
 *
 * El JSON descargado desde Firebase Console escapa los saltos de línea como
 * `\n`. Al pasarlo por una variable de entorno, Node recibe el literal `\\n`
 * (barra invertida + n), que `firebase-admin` no acepta (lanza "Invalid PEM").
 * Esta función convierte esas secuencias en saltos reales y es idempotente:
 * si la key ya viene con saltos reales, no se altera.
 */
export function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

/**
 * Construye un `ServiceAccount` de firebase-admin a partir de variables de
 * entorno. Es fail-fast: si falta cualquiera de las tres credenciales, lanza
 * un error descriptivo (el backend no debe arrancar a medias).
 */
export function buildServiceAccountFromEnv(env: {
  projectId: string | undefined;
  clientEmail: string | undefined;
  privateKey: string | undefined;
}): ServiceAccount {
  if (!env.projectId) {
    throw new Error('Missing required environment variable: FIREBASE_PROJECT_ID');
  }
  if (!env.clientEmail) {
    throw new Error('Missing required environment variable: FIREBASE_CLIENT_EMAIL');
  }
  if (!env.privateKey) {
    throw new Error('Missing required environment variable: FIREBASE_PRIVATE_KEY');
  }

  return {
    projectId: env.projectId,
    clientEmail: env.clientEmail,
    privateKey: normalizePrivateKey(env.privateKey),
  };
}
