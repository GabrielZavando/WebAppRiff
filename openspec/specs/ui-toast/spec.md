# ui-toast Specification

## Purpose

Toast de notificación reutilizable y no bloqueante para el feedback del envío de formularios: un único componente Astro con variantes success/error, consumido por el runtime de envío vía evento custom, con autocierre, cierre manual y semántica ARIA por variante. Agnóstico de la página: contacto y cotización lo usan igual.

## Requirements

### Requirement: Toast renders the success and error variants

El toast SHALL renderizarse con una variante `success` o `error` recibida como prop que determina el icono y el estado inicial visibles: la variante success SHALL mostrar un icono de check (`lucide:circle-check`) y la variante error un icono de alerta (`lucide:circle-alert`), ambos del set Lucide del proyecto y decorativos (`aria-hidden="true"`), junto al mensaje recibido como prop (string). En su estado inicial (SSG) el toast SHALL renderizarse oculto (no visible hasta recibir un resultado) y con la región de anuncios (`role`/`aria-live`) pre-existente y VACÍA en el HTML inicial: el contenido solo SHALL cambiar al recibir el resultado y el componente no SHALL montarse al vuelo (de modo que los lectores de pantalla tienen la región registrada antes del anuncio).

#### Scenario: Render con variante success

- **WHEN** el Toast renderiza con variante `success` y un mensaje
- **THEN** muestra el mensaje recibido como prop
- **AND** muestra un icono de check del set Lucide (`lucide:circle-check`) con `aria-hidden="true"`
- **AND** el elemento raíz del toast está oculto (`hidden`)

#### Scenario: Render con variante error

- **WHEN** el Toast renderiza con variante `error` y un mensaje
- **THEN** muestra el mensaje recibido como prop
- **AND** muestra un icono de alerta del set Lucide (`lucide:circle-alert`) con `aria-hidden="true"`
- **AND** el elemento raíz del toast está oculto (`hidden`)

#### Scenario: La región de anuncios existe vacía y pre-existente en el HTML inicial

- **WHEN** el Toast renderiza en su estado inicial (sin mensaje, defaults)
- **THEN** la raíz con `role`, `aria-live` y `hidden` ya existe en el HTML renderizado (región pre-existente, no montada al vuelo)
- **AND** el contenido del mensaje está vacío (sin texto)
- **AND** el contenido solo se llena al recibir el resultado del envío

### Requirement: Toast uses per-variant live-region semantics

El toast SHALL usar semántica ARIA según la variante: la variante success SHALL exponer `role="status"` con `aria-live="polite"`; la variante error SHALL exponer `role="alert"` con `aria-live="assertive"`. Al recibir un resultado en runtime, la semántica SHALL actualizarse junto con la variante aplicada.

#### Scenario: Éxito usa status/polite

- **WHEN** el toast muestra un resultado de éxito
- **THEN** el elemento raíz expone `role="status"` y `aria-live="polite"`

#### Scenario: Error usa alert/assertive

- **WHEN** el toast muestra un resultado de error
- **THEN** el elemento raíz expone `role="alert"` y `aria-live="assertive"`

#### Scenario: La semántica cambia con un nuevo resultado

- **WHEN** el toast muestra un resultado de error tras haber mostrado uno de éxito (o viceversa)
- **THEN** el `role` y el `aria-live` del elemento raíz corresponden a la variante del resultado más reciente

### Requirement: Toast has an explicit close control

El toast SHALL renderizar un botón de cierre (icono X del set Lucide, `lucide:x`) en la esquina superior derecha del componente, con `aria-label="Cerrar notificación"`, que permite cerrarlo manualmente en cualquier momento antes del autocierre.

#### Scenario: Botón X presente con aria-label

- **WHEN** el Toast renderiza
- **THEN** existe un botón de cierre en la esquina superior derecha con `aria-label="Cerrar notificación"`
- **AND** su icono X es decorativo (`aria-hidden="true"`)

#### Scenario: Click en X cierra el toast y cancela el autocierre

- **WHEN** el toast está visible con un autocierre pendiente y el usuario hace click en el botón X
- **THEN** el toast se oculta de inmediato
- **AND** el timer de autocierre pendiente se cancela (no cierra de nuevo)

### Requirement: Toast appears on form result and auto-closes after 5 seconds

El toast SHALL mostrarse al recibir el resultado del envío del backend (éxito 2xx o error) y SHALL autocerrarse a los 5 segundos de mostrarse. Al recibir un nuevo resultado, el timer de autocierre SHALL reiniciarse: el cierre pendiente del resultado anterior SHALL cancelarse antes de programar el nuevo.

#### Scenario: Aparece con el resultado de éxito

- **WHEN** el runtime de envío publica un resultado de éxito (2xx) con su mensaje
- **THEN** el toast se hace visible mostrando ese mensaje con la variante success

#### Scenario: Aparece con el resultado de error

- **WHEN** el runtime de envío publica un resultado de error (no-2xx o fallo de red) con su mensaje
- **THEN** el toast se hace visible mostrando ese mensaje con la variante error

#### Scenario: Autocierre a los 5 segundos

- **WHEN** el toast se hace visible por un resultado y pasan 5 segundos sin interacción
- **THEN** el toast se oculta automáticamente

#### Scenario: Un nuevo resultado reinicia el timer

- **WHEN** el toast está visible con un autocierre pendiente y llega un nuevo resultado de envío
- **THEN** el cierre pendiente anterior se cancela
- **AND** un nuevo autocierre de 5 segundos se programa desde el resultado más reciente
- **AND** el toast muestra el mensaje y la variante del resultado más reciente

### Requirement: Toast is non-blocking and keeps focus in the form

El toast SHALL ser una notificación no bloqueante: sin backdrop ni comportamiento modal, posicionado de forma fija (fixed) respecto al viewport sin desplazar el contenido de la página, y SHALL mantener el foco en el formulario al aparecer (no roba foco ni mueve el foco al toast).

#### Scenario: Sin backdrop y sin desplazar el contenido

- **WHEN** el toast se hace visible
- **THEN** no existe un backdrop que bloquee la interacción con la página
- **AND** el contenido de la página no se desplaza por la aparición del toast

#### Scenario: El foco permanece en el formulario

- **WHEN** el toast se hace visible tras un envío
- **THEN** el foco permanece en el formulario (el toast no recibe foco)

### Requirement: Toast uses design tokens and flat design

El toast SHALL usar los tokens de diseño del proyecto para colores y tipografías (scales `success`/`error` y fuentes `heading`/`body`; sin literales hex en el markup) y SHALL respetar el flat design del proyecto (sin utilidades `rounded*` ni `shadow*`).

#### Scenario: Colores solo vía tokens

- **WHEN** se inspecciona el markup renderizado del toast
- **THEN** los colores provienen de tokens de diseño (clases utilitarias de los scales success/error y tokens de texto)
- **AND** no hay literales hex en el markup

#### Scenario: Sin rounded ni shadow

- **WHEN** se renderiza el Toast
- **THEN** no aplica utilidades `rounded*` ni `shadow*` (flat design estricto del proyecto)

### Requirement: The form runtime publishes the submit result as a custom event

El runtime de envío de formularios SHALL publicar el resultado de cada envío como un evento custom `riff:form-result` sobre el `<form>` (burbujeante), con el tipo (`kind`: `success` | `error`) y el mensaje resuelto (de las opciones del cliente o de los atributos `data-success-message` / `data-error-message` del formulario) en el `detail`, en lugar de escribir en un bloque de estado del DOM. El toast SHALL consumir ese evento para mostrarse; el runtime de envío no conoce el DOM del toast.

#### Scenario: El resultado de éxito se publica como evento

- **WHEN** el `fetch` responde 2xx y el mensaje se resuelve desde `data-success-message` (o las opciones)
- **THEN** se dispara el evento `riff:form-result` sobre el `<form>` con `detail.kind = "success"` y `detail.message` igual al mensaje resuelto

#### Scenario: El resultado de error se publica como evento

- **WHEN** el `fetch` responde no-2xx o falla (red/timeout) y el mensaje se resuelve desde `data-error-message` (o las opciones)
- **THEN** se dispara el evento `riff:form-result` sobre el `<form>` con `detail.kind = "error"` y `detail.message` igual al mensaje resuelto

#### Scenario: El runtime no acopla el DOM del toast

- **WHEN** la página no renderiza el toast (o el toast aún no está en el DOM)
- **THEN** el envío funciona igual y publica el evento (el toast simplemente no se muestra)

### Requirement: initFormToast binds at most one result listener

El cliente del toast (`initFormToast`) SHALL registrar el listener para el resultado del envío UNA SOLA VEZ (a nivel de módulo o con flag/WeakSet equivalente), no en cada mount del componente: inicializarlo más de una vez SHALL registrar a lo sumo un listener, de modo que un resultado dispare un único manejo (un solo show y un solo timer) y que navegaciones ida/vuelta no acumulen listeners. SHALL devolver un cleanup que desvincule el listener y permita volver a inicializarlo.

#### Scenario: Doble inicialización no duplica el manejo

- **WHEN** `initFormToast` se inicializa más de una vez y llega un resultado de envío
- **THEN** queda registrado a lo sumo un listener de resultado
- **AND** el resultado dispara un único manejo del toast (un solo show y un solo timer)

#### Scenario: Re-inicialización tras cleanup no acumula listeners

- **WHEN** se ejecuta el cleanup y `initFormToast` se vuelve a inicializar (simulando navegaciones ida/vuelta), repetidamente
- **THEN** en todo momento queda registrado a lo sumo un listener de resultado (no se acumulan listeners entre navegaciones)

#### Scenario: El cleanup desvincula el listener

- **WHEN** se ejecuta el cleanup devuelto por `initFormToast` y llega un resultado de envío
- **THEN** el toast ya no reacciona al resultado (listener desvinculado)
- **AND** `initFormToast` puede volver a inicializarse

### Requirement: The toast delegation is wired once per session on the pages that use the toast

Las páginas que renderizan el toast (`/contacto` y `/cotizacion`) SHALL registrar el listener del toast (invocando `initFormToast()`) UNA SOLA VEZ por sesión, a nivel de módulo y fuera del re-binding de `astro:page-load`, de modo que el toast reaccione al resultado del envío en producción. Las navegaciones de ida y vuelta entre páginas que usan el toast no SHALL acumular ni perder el registro: el listener vive en `document`, que persiste entre los body swaps de View Transitions.

#### Scenario: El toast reacciona al resultado en las páginas que lo usan

- **WHEN** la página `/contacto` o `/cotizacion` se carga y el runtime de envío publica un resultado
- **THEN** el toast se muestra (el listener quedó registrado una vez al cargar la página)
- **AND** las invocaciones repetidas del registro (ambos scripts de página) son no-op

#### Scenario: Las navegaciones no acumulan ni pierden el registro

- **WHEN** se navega ida y vuelta entre páginas que usan el toast (View Transitions)
- **THEN** el listener sigue registrado a lo sumo una vez por sesión
- **AND** el toast sigue reaccionando a los resultados tras cada navegación
