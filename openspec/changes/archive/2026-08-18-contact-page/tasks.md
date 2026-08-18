## 1. Types & Config

- [x] 1.1 Crear `apps/web/src/lib/types/contact-form.ts` con `ContactAreaInteres` (`{ readonly id: string; readonly label: string }`), `ContactHeroProps` (`{ readonly headline: string; readonly highlightedWord: string; readonly subtitle: string }`), `ContactFormProps` (`{ readonly areas: readonly ContactAreaInteres[]; readonly config: ContactFormConfig }`), `ContactFormConfig` (`{ readonly action: string; readonly submitLabel: string; readonly placeholders: {...} }`), `ContactBarProps` (`{ readonly phone: string; readonly email: string; readonly phoneHref: string; readonly emailHref: string; readonly socialLinks: readonly SocialLink[] }`)
- [x] 1.2 Crear `apps/web/src/lib/config/contact-page.ts` con `CONTACT_AREAS` (5 áreas: medicion-fluidos, tratamiento-agua, productos-quimicos, control-accesorios, servicio-tecnico), `CONTACT_FORM_CONFIG` (action default `/api/v1/contacts`, submitLabel "ENVIAR MENSAJE", placeholders), y `CONTACT_PAGE_CONTENT` (`{ hero, form, bar }`) usando `getContactInfo()` para la barra
- [x] 1.3 Test unitario `apps/web/src/lib/config/__tests__/contact-page.test.ts`: `CONTACT_AREAS` tiene exactamente 5 elementos con `id` no vacío y `label` no vacío
- [x] 1.4 Test unitario: `CONTACT_FORM_CONFIG.action` default es `/api/v1/contacts` y `submitLabel` es "ENVIAR MENSAJE"
- [x] 1.5 Test unitario: `CONTACT_PAGE_CONTENT.bar.phone` es "+56 2 29079067" y `email` es "contacto@riff.cl" (o valores de env con fallback)

## 2. Componente ContactHero.astro (TDD)

- [x] 2.1 Escribir `apps/web/src/components/__tests__/ContactHero.test.ts` (AstroContainer): renderiza el headline completo y la palabra resaltada dentro de `<span class="text-primary">`
- [x] 2.2 Test: cuando `highlightedWord` está vacío, NO se renderiza `<span class="text-primary">` y el headline aparece completo
- [x] 2.3 Test: el `subtitle` se renderiza como elemento con texto no vacío
- [x] 2.4 Test: snapshot del HTML renderizado (regresión visual)
- [x] 2.5 Crear `apps/web/src/components/ContactHero.astro` (estructura: `<section>` con headline `<h1>` + `splitHeadline()` + subtítulo `<p>`), props tipadas `ContactHeroProps`, reutilizando `splitHeadline` de `lib/config/hero-banner.ts`
- [x] 2.6 Verificar que el hero usa tokens (`text-primary` para el resaltado, `text-white`/`text-secondary` según fondo) y NO usa clases `rounded*` ni `shadow*`

## 3. Componente ContactForm.astro (TDD)

- [x] 3.1 Escribir `apps/web/src/components/__tests__/ContactForm.test.ts` (AstroContainer): el `<form>` tiene `method="post"` y `action` configurable
- [x] 3.2 Test: se renderizan 4 inputs (`nombre`, `empresa`, `email` tipo email, `telefono` tipo tel) cada uno con `<label for>` asociado y texto uppercase
- [x] 3.3 Test: se renderiza un `<fieldset>` con `<legend>` y exactamente 5 `<input type="checkbox" name="areasDeInteres">`, cada uno con `<label for>` y `value` = area.id
- [x] 3.4 Test: se renderiza `<textarea name="mensaje">` con `<label for>` y placeholder
- [x] 3.5 Test: el `<button type="submit">` tiene texto que contiene "ENVIAR MENSAJE", clase `bg-accent`, e icono `lucide:arrow-right` decorativo (`aria-hidden="true"`)
- [x] 3.6 Test: el HTML NO contiene clases `rounded` ni `shadow`
- [x] 3.7 Test: snapshot del HTML renderizado (regresión visual)
- [x] 3.8 Crear `apps/web/src/components/ContactForm.astro` (estructura: `<form method="post" action={config.action}>` → grid responsive de inputs (1 col mobile / 2 col desktop) → `<fieldset>` de checkboxes → `<textarea>` → `<button type="submit">`), props tipadas `ContactFormProps`
- [x] 3.9 Implementar layout responsivo: grid `grid-cols-1 md:grid-cols-2` para los pares de inputs; checkboxes en `grid-cols-1 sm:grid-cols-2`; textarea full-width; botón `bg-accent hover:bg-accent-dark text-white`
- [x] 3.10 Implementar validación HTML5: `required` en nombre/email/telefono/mensaje, `type="email"` y `type="tel"` para validación nativa del navegador

## 4. Componente ContactBar.astro (TDD)

- [x] {n} Escribir `apps/web/src/components/__tests__/ContactBar.test.ts` (AstroContainer): renderiza anchor `tel:` y anchor `mailto:`
- [x] {n} Test: cuando hay social links, renderiza `<nav aria-label="Redes sociales">` con un anchor por link, cada uno con `aria-label`, `target="_blank"`, `rel="noopener noreferrer"`
- [x] {n} Test: el HTML NO contiene clases `rounded` ni `shadow`
- [x] {n} Test: snapshot del HTML renderizado
- [x] {n} Crear `apps/web/src/components/ContactBar.astro` (barra inferior con teléfono, email e iconos sociales via `Icon`), props tipadas `ContactBarProps`, reutilizando `socialIconMap` del patrón de Footer
- [x] {n} Verificar tokens: `bg-secondary-dark` o `bg-bg` según diseño, `text-white`/`text-primary`, sin `rounded*`/`shadow*`

## 5. Página /contacto

- [x] 5.1 Crear `apps/web/src/pages/contacto.astro`: `<Layout title="Contacto — Riff" description="..." hero>` conteniendo `<ContactHero {...CONTACT_PAGE_CONTENT.hero} />`, `<ContactForm {...CONTACT_PAGE_CONTENT.form} />`, `<ContactBar {...CONTACT_PAGE_CONTENT.bar} />`
- [x] 5.2 ~~Verificar que `Layout.astro` NO se modifica~~ — SUPERADO por corrección: `Layout.astro` ahora recibe `showSearch` (ver Grupo 7)
- [x] 5.3 ~~Verificar que la página usa `hero` para mostrar `banner_home.webp`~~ — SUPERADO por corrección: la página ya NO usa imagen de hero (ver Grupo 7)

## 6. Verificación & Cleanup

- [x] 6.1 `npm run build --workspace=apps/web` → success (72 páginas, incluye /contacto)
- [x] 6.2 `npm run typecheck --workspace=apps/web` → success para los archivos del change (los 8 errores restantes de `astro check` son preexistentes en `src/pages/productos/__tests__/[slug].test.ts`, fuera de alcance de este change)
- [x] 6.3 `npm run lint --workspace=apps/web` → success (sin errores en archivos del change)
- [x] 6.4 `npm run test --workspace=apps/web` → all pass (788 tests, incl. 30 nuevos del change: 7 config + 7 hero + 12 form + 7 bar + 4 page)
- [x] 6.5 `openspec validate contact-page` → valid
- [x] 6.6 `openspec status --change contact-page --json` → todos los artefactos completos (`isComplete: true`)

## 7. Correcciones post-apply (fondo azul, caja, botón, ocultar buscador)

- [x] 7.1 Test (ContactForm): el botón submit lleva `w-full` y un layout flex que pone el texto a la izquierda y el icono `lucide:arrow-right` (`aria-hidden="true"`) a la derecha (ej. `justify-between`)
- [x] 7.2 Modificar `ContactForm.astro`: envolver el `<form>` en tarjeta blanca centrada (`bg-white mx-auto max-w-3xl border border-border`); botón `w-full flex items-center justify-between` con `<span>` texto + icono a la derecha; sin `rounded*`/`shadow*`
- [x] 7.3 Test (página contacto): el contenido usa fondo `bg-secondary` (azul sólido) y el HTML NO contiene la imagen `banner_home.webp`
- [x] 7.4 Modificar `Layout.astro`: añadir prop `showSearch?: boolean = true` y omitir `<SearchForm />` cuando es `false`
- [x] 7.5 Modificar `contacto.astro`: pasar `hero={false}` y `showSearch={false}`; envolver `ContactHero`+`ContactForm`+`ContactBar` en `<div class="bg-secondary ...">`
- [x] 7.6 Test (página contacto): el HTML NO contiene `role="search"` ni el botón "BUSCAR" (buscador global oculto en esta página)
- [x] 7.7 Regenerar snapshots afectados (ContactHero, ContactForm, ContactBar, contacto page) y ejecutar suite completa → all pass (792 tests)
- [x] 7.8 `astro build` (incluye /contacto) + `openspec validate contact-page` → success

## 8. Correcciones post-apply (fondo #006874, botón centrado, barra debajo del formulario)

- [x] 8.1 Test (ContactForm): el botón submit lleva `w-full`, layout flex **centrado** (`justify-center`) y un `gap` (ej. `gap-3`) que separa elegantemente el texto del icono `lucide:arrow-right`
- [x] 8.2 Modificar `ContactForm.astro`: botón `w-full flex items-center justify-center gap-3` (texto + icono centrados, icono no pegado)
- [x] 8.3 Test (ContactBar / página): la barra NO lleva `bg-secondary-dark`, usa `bg-primary-deep` (o transparente sobre el wrapper azul), y está restringida a `max-w-3xl mx-auto`; aparece después del `<form>` en el DOM
- [x] 8.4 Modificar `ContactBar.astro`: fondo `bg-primary-deep`, `max-w-3xl mx-auto`, teléfono + email + redes sociales en fila centrada; modificar `contacto.astro` wrapper `bg-secondary` → `bg-primary-deep`
- [x] 8.5 Regenerar snapshots afectados y ejecutar suite completa → all pass
- [x] 8.6 `astro build` (incluye /contacto) + `openspec validate contact-page` → success

## 9. Ajustes de ritmo visual en navegador (gap 16/32, ancho completo, línea divisoria)

- [x] {n} Test (página contacto): entre el `<h1>` y el `<form>` hay un espaciador `h-4 sm:h-8` (16px móvil / 32px desktop); `ContactHero` lleva `pb-0` y el wrapper de `ContactForm` no lleva `pt-12`/`pt-16`
- [x] {n} Modificar `ContactHero.astro`: padding inferior `pb-0` (sin hueco grande al formulario)
- [x] {n} Modificar `contacto.astro`: insertar espaciador `<div class="h-4 sm:h-8" aria-hidden="true"></div>` entre `ContactHero` y `ContactForm`
- [x] {n} Test (ContactForm / página): el `<form>` es `bg-white` y NO lleva `max-w-3xl`; está dentro de `container mx-auto px-4 sm:px-6 lg:px-8` (ancho completo del contenido, igual que el header)
- [x] {n} Modificar `ContactForm.astro`: quitar `mx-auto max-w-3xl` de la caja blanca y poner el wrapper en `pb-0` (sin padding inferior); `ContactBar.astro`: usar `container mx-auto px-4 sm:px-6 lg:px-8` en vez de `max-w-3xl`
- [x] {n} Test (ContactBar): primer hijo del contenedor es un divisor `border-t border-primary` con padding equivalente (`my-4 sm:my-8`), antes de tel/email/redes, a todo el ancho del formulario
- [x] {n} Modificar `ContactBar.astro`: agregar `<div class="border-t border-primary my-4 sm:my-8"></div>` como primer elemento del contenedor
- [x] {n} Regenerar snapshots afectados y ejecutar suite completa → all pass
- [x] {n} `astro build` (incluye /contacto) + `openspec validate contact-page` → success

## 10. Ajuste final: barra con teléfono/correo a la izquierda y redes a la derecha

- [x] {n} Test (ContactBar): el contenedor usa `sm:justify-between` (no `justify-center`); teléfono+correo en un grupo izquierdo y el `<nav>` de redes es hermano a la derecha
- [x] {n} Modificar `ContactBar.astro`: contenedor `sm:flex-row sm:items-center sm:justify-between` (mobile `items-start`); teléfono+correo envueltos en grupo izquierdo; `<nav>` redes como hermano
- [x] {n} Regenerar snapshots afectados y ejecutar suite completa → all pass
- [x] {n} `astro build` (incluye /contacto) + `openspec validate contact-page` → success
