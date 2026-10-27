# top-header Specification

## REMOVED Requirements

### Requirement: TopHeader renders phone number
**Reason**: La barra superior se retira del sitio; el teléfono pasa a estar disponible globalmente mediante el FAB de llamada (`phone-fab`) y en el Footer.

**Migration**: Usar `<PhoneFab phone={contact.phone} />` en `Layout.astro`; la normalización E.164 se conserva en el nuevo componente y en `getContactInfo()`.

### Requirement: TopHeader renders social media links
**Reason**: Los enlaces sociales de la barra superior se eliminan; Footer y ContactBar siguen siendo los puntos de render de redes.

**Migration**: Mantener `getSocialLinks()` y renderizar las redes únicamente en `Footer.astro` y `ContactBar.astro`.

### Requirement: TopHeader does not depend on local SVG icon components
**Reason**: El componente que albergaba esta restricción deja de existir.

**Migration**: La regla de iconos Lucide se conserva para el resto del sitio; el nuevo `PhoneFab` usa `lucide:phone`.

### Requirement: TopHeader supports a transparent mode
**Reason**: Ya no existe una barra de contacto que deba adaptarse al hero.

**Migration**: `Header` y `SearchForm` conservan su prop `transparent`; no se requiere reemplazo para la barra retirada.

### Requirement: TopHeader is hidden on mobile
**Reason**: La barra superior completa se elimina, por lo que su visibilidad responsive deja de aplicar.

**Migration**: Ninguna; el teléfono queda accesible en el FAB global y en el Footer.

### Requirement: TopHeader uses brand colors and layout
**Reason**: El contenedor y sus colores se eliminan con la capability.

**Migration**: Ninguna; el chrome restante sigue usando `bg-secondary`.

### Requirement: TopHeader accessibility
**Reason**: El landmark de región "Barra de contacto" y su navegación social desaparecen.

**Migration**: El FAB de teléfono expone `aria-label="Llamar a Riff"`; los enlaces sociales accesibles permanecen en Footer y ContactBar.

### Requirement: TopHeader normalizes phone number to E.164 tel: format (regression)
**Reason**: La lógica de normalización deja de vivir en `TopHeader`; el componente se retira.

**Migration**: La misma normalización se implementa y prueba en `PhoneFab.astro` (escenario SC-201).

### Requirement: Footer X icon uses the official X brand logo (regression)
**Reason**: Este requisito duplicaba en la capability `top-header` una regla que pertenece al Footer, que se retira junto con la barra.

**Migration**: La regla permanece cubierta por `site-footer` ("Footer social icon map uses the official X brand logo").

### Requirement: TopHeader minimizes its vertical footprint
**Reason**: La reducción de altura deja de tener sentido al eliminar el componente; el sitio gana esos 32 px.

**Migration**: El layout ya no reserva espacio para la barra; no se requiere compensación.

### Requirement: Configuration is defined in code constants
**Reason**: La configuración de contacto sigue existiendo, pero este requisito estaba acoplado a `top-header`; se retira con la capability.

**Migration**: `configure-social-links` y `contact-page` conservan el contrato de `lib/config/contact.ts` y `getContactInfo()`.
