## 1. Types y Configuración

- [x] 1.1 Crear `src/lib/types/top-header.ts` con interfaces `ContactInfo` y `SocialLink`
- [x] 1.2 Crear `src/lib/config/contact.ts` con `getContactInfo()` que lee `import.meta.env`
- [x] 1.3 Test unitario: `getContactInfo()` retorna valores correctos cuando env vars están definidas
- [x] 1.4 Test unitario: `getContactInfo()` retorna strings vacíos cuando env vars faltan

## 2. Componente TopHeader.astro

- [x] 2.1 Crear `src/components/TopHeader.astro` con estructura base (header, div container, phone section, social nav)
- [x] 2.2 Implementar renderizado del teléfono como link `tel:` con icono
- [x] 2.3 Implementar renderizado condicional de links sociales (solo si URL definida)
- [x] 2.4 Aplicar clases Tailwind: `hidden sm:flex bg-brand-navy h-9`, container, spacing
- [x] 2.5 Añadir atributos de accesibilidad: `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`, `<nav aria-label="Redes sociales">`
- [x] 2.6 Test: componente renderiza teléfono primario correctamente
- [x] 2.7 Test: componente renderiza solo links sociales con URL definida
- [x] 2.8 Test: componente tiene clases `hidden sm:flex` para mobile
- [x] 2.9 Test: links sociales tienen `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`
- [x] 2.10 Test: wrapper tiene `bg-brand-navy` y `h-9`
- [x] 2.11 Test: snapshot del HTML renderizado para regresión visual

## 3. Iconos SVG

- [x] 3.1 Crear `src/components/icons/PhoneIcon.astro`
- [x] 3.2 Crear `src/components/icons/FacebookIcon.astro`
- [x] 3.3 Crear `src/components/icons/XIcon.astro`
- [x] 3.4 Crear `src/components/icons/InstagramIcon.astro`
- [x] 3.5 Crear `src/components/icons/LinkedInIcon.astro`

## 4. Integración en Layout

- [x] 4.1 Actualizar `src/layouts/Layout.astro` para importar y renderizar `<TopHeader />` encima de `<slot />`
- [x] 4.2 Test E2E: página index muestra TopHeader en desktop
- [x] 4.3 Test E2E: TopHeader oculto en viewport <640px

## 5. Verificación y Limpieza

- [x] 5.1 Ejecutar `npm run build --workspace=apps/web` → success
- [x] 5.2 Ejecutar `npm run typecheck --workspace=apps/web` → success
- [x] 5.3 Ejecutar `npm run lint --workspace=apps/web` → success
- [x] 5.4 Ejecutar `npm run test --workspace=apps/web` → all pass
