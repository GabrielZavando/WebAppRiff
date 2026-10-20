## 1. Soporte HTML en email (TDD)

- [x] 1.1 Agregar a `resend-email-notifier.spec.ts` los tests que fallan: `html` presente se envía junto con `text` y `html` ausente no aparece en el payload.
- [x] 1.2 Extender `EmailMessage` con `html?: string` y actualizar `ResendEmailNotifier` para incluirlo condicionalmente; dejar los tests verdes.
- [x] 1.3 Crear `lead-email-template.spec.ts` con tests que fallan: renderiza fila etiqueta/valor, usa teal `#41B3C4` y navy `#1F2D40`, y escapa `<script>`/`&`/comillas.
- [x] 1.4 Implementar `apps/backend/src/email/application/lead-email-template.ts` (tablas, estilos inline, escapado de valores) y dejar los tests verdes.
- [x] 1.5 Integrar `html` en `buildLeadEmailMessage` y actualizar el contract test de `IEmailNotifier` si corresponde.

## 2. Persistencia de contactos en Firestore (TDD)

- [x] 2.1 Crear tests que fallan para la entidad y el repositorio de contactos: `create` persiste todos los campos, `areasDeInteres` vacío por defecto y `creadoEn` asignado.
- [x] 2.2 Implementar `Contacto`/`ContactInput` en `contacts/domain/`, el port `IContactRepository` y `ContactRepository` en `contacts/infrastructure/` (colección `contactos`, patrón de `CotizacionRepository`).
- [x] 2.3 Actualizar `contact.service.spec.ts` con tests que fallan: persiste antes de notificar, un fallo del notificador se loguea y no se propaga, el honeypot no persiste ni notifica, y un fallo de persistencia se propaga.
- [x] 2.4 Implementar en `ContactService` la inyección de `IContactRepository`, la persistencia previa y el `try/catch` con `Logger.error`; dejar los tests verdes.
- [x] 2.5 Registrar `I_CONTACT_REPOSITORY` en `ContactsModule` y actualizar su test de módulo/DI.

## 3. Resiliencia en cotizaciones (TDD)

- [x] 3.1 Actualizar `cotizacion.service.spec.ts`: reemplazar la expectativa de propagación por "loguea y devuelve la cotización persistida"; test fallando.
- [x] 3.2 Envolver `notifyQuoteRequest` en `try/catch` con `Logger.error` en `CotizacionService`; dejar los tests verdes.

## 4. Tests end-to-end

- [x] 4.1 Actualizar `test/contacts.e2e-spec.ts`: verifica persistencia en el fake de Firestore y que un fallo del notificador devuelve 201.
- [x] 4.2 Actualizar/crear el e2e de cotizaciones: verifica que un fallo del notificador devuelve 201 con la cotización persistida.
- [x] 4.3 Ejecutar `make test` (o el target de tests del backend) y corregir cualquier regresión.

## 5. Documentación y configuración

- [x] 5.1 Actualizar `docs/api/api-spec.yml`: quitar los `502` de contactos/cotizaciones, documentar el comportamiento best-effort y que contactos ahora persiste.
- [x] 5.2 Actualizar `docs/data-model/data-model.md` con la colección `contactos` y sus campos.
- [x] 5.3 Actualizar `apps/backend/.env.example` y `.env.example` con el remitente de ejemplo `notificaciones@send.somosriff.cl` y notas del subdominio.
- [x] 5.4 Actualizar `docs/runbooks/backend-staging-cloud-run.md` con los pasos de Secret Manager (`RESEND_API_KEY`, `secretAccessor`, `--update-secrets`) y el cambio de `CONTACT_FROM_EMAIL` tras verificar `send.somosriff.cl`.

## 6. Verificación final

- [x] 6.1 Ejecutar `npx openspec validate --all --strict` sin errores.
- [x] 6.2 Ejecutar `make ci` (lint + typecheck + test + audit) sin errores.
