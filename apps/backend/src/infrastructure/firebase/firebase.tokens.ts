/**
 * Inyección de tokens para la infraestructura Firebase.
 *
 * Los módulos de dominio inyectan Firestore vía `@Inject(FIRESTORE)` en sus
 * repositories (ubicados en `infrastructure/`). Ninguna capa `domain/` ni
 * `application/` debe importar `firebase-admin` directamente (DIP — ver
 * docs/backend-standards.md y la regla `no-infra-from-domain` de
 * `.dependency-cruiser.js`).
 */
export const FIREBASE_APP = 'FIREBASE_APP';
export const FIRESTORE = 'FIRESTORE';
export const FIREBASE_AUTH = 'FIREBASE_AUTH';
