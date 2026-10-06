# contacts-api Specification

## Purpose
API pública de contactos: endpoint `POST /api/v1/contacts` que valida la solicitud del formulario de contacto, rechaza bots vía honeypot y envía un correo con todos los campos a `contacto@somosriff.cl`, con rate limiting estricto.

## ADDED Requirements

### Requirement: POST /api/v1/contacts crea una solicitud de contacto y notifica por correo (público, sin auth)

El sistema SHALL aceptar envíos del formulario de contacto desde usuarios sin autenticar vía `POST /api/v1/contacts`. El endpoint SHALL validar el payload con las mismas reglas estrictas que `POST /api/v1/quotes`, SHALL rechazar envíos automatizados mediante el campo honeypot `website` y SHALL enviar un correo con todos los campos a `CONTACT_TO_EMAIL` (default `contacto@somosriff.cl`) a través del port `IEmailNotifier`. Ante un envío correcto responde HTTP 201 con el envelope estándar.

#### Scenario: Envío exitoso con todos los campos

- **WHEN** se realiza un POST sin autenticar a `/api/v1/contacts` con body `{ "nombre": "Juan Pérez", "empresa": "Empresa SA", "email": "juan@empresa.com", "telefono": "+56912345678", "areasDeInteres": ["medicion-fluidos", "tratamiento-agua"], "mensaje": "Necesito soporte técnico" }`
- **THEN** el sistema responde HTTP 201 con envelope `{ "data": { "nombre": "Juan Pérez", "empresa": "Empresa SA", "email": "juan@empresa.com", "telefono": "+56912345678", "areasDeInteres": ["medicion-fluidos", "tratamiento-agua"], "mensaje": "Necesito soporte técnico" }, "error": null, "meta": { ... } }`
- **AND** se envía un correo a `contacto@somosriff.cl` cuyo texto incluye todos los campos del payload

#### Scenario: Rechazado — campo requerido faltante

- **WHEN** un POST a `/api/v1/contacts` con body `{ "nombre": "Juan", "email": "j@e.com", "mensaje": "Hola" }` (sin `empresa` ni `telefono`)
- **THEN** el sistema responde HTTP 400 con envelope de error de validación
- **AND** no se envía ningún correo

#### Scenario: Rechazado — email inválido

- **WHEN** un POST a `/api/v1/contacts` con `email: "not-an-email"`
- **THEN** el sistema responde HTTP 400

#### Scenario: Rechazado — campos extra (whitelist)

- **WHEN** un POST a `/api/v1/contacts` con campos no declarados en el DTO (p.ej. `{ ..., "hackerfield": "injected" }`)
- **THEN** el sistema responde HTTP 400 (forbidNonWhitelisted)
- **AND** no se envía ningún correo

#### Scenario: Fallo del proveedor de correo

- **WHEN** `IEmailNotifier.sendEmail` lanza (proveedor no disponible, timeout o no-2xx)
- **THEN** el sistema responde HTTP 502 con envelope de error
- **AND** el error no expone la API key ni secretos

### Requirement: Rate limiting estricto en POST /api/v1/contacts

El sistema SHALL limitar `POST /api/v1/contacts` a 5 peticiones por minuto por IP (ventana de 60 s) mediante el throttler ya presente en el stack, más estricto que el límite general del BFF.

#### Scenario: Supera el límite

- **WHEN** una misma IP supera 5 peticiones a `/api/v1/contacts` en una ventana de 60 s
- **THEN** el sistema responde HTTP 429 (throttled)
- **AND** no se envía ningún correo

#### Scenario: Bajo el límite

- **WHEN** una misma IP hace hasta 5 peticiones a `/api/v1/contacts` en una ventana de 60 s
- **THEN** cada petición se procesa con normalidad (201 o error de validación según el payload)

### Requirement: Honeypot anti-spam en POST /api/v1/contacts

El sistema SHALL tratar el campo `website` como honeypot: si viene con valor no vacío, el endpoint SHALL responder éxito simulado (201) sin persistir ni enviar correo, para no confirmar al bot. Si viene vacío o ausente, el flujo continúa con normalidad. El campo SHALL estar declarado en el DTO (requisito de `forbidNonWhitelisted`) con `@IsOptional()`, de modo que el payload sin el campo no falle la validación.

#### Scenario: Honeypot relleno se ignora silenciosamente

- **WHEN** un POST a `/api/v1/contacts` incluye `website: "http://spam.example"` (campo que un humano no vería)
- **THEN** el sistema responde HTTP 201 con éxito simulado
- **AND** no se envía ningún correo

#### Scenario: Honeypot vacío no bloquea

- **WHEN** un POST a `/api/v1/contacts` incluye `website: ""` o no lo incluye
- **THEN** el endpoint procesa la solicitud con normalidad (201 y correo)

#### Scenario: Formulario previo sin el campo website (retrocompatibilidad)

- **WHEN** un frontend desplegado antes de este change envía `POST /api/v1/contacts` sin el campo `website` (payload solo con los campos originales del formulario)
- **THEN** el sistema responde HTTP 201 sin errores de validación (el campo es opcional)
- **AND** envía el correo con normalidad