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
