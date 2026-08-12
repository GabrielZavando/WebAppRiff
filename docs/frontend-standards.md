# Frontend Standards

> Personalizado para el proyecto Riff Catálogo Digital Headless — **Dual Stack**: Astro (sitio público SSG) + Angular (panel admin).

## Componentes (común a ambos stacks)

- Un componente = una responsabilidad
- Props tipadas explícitamente, sin `any`
- Estados locales para UI, stores globales para dominio
- Componentes presentacionales separados de contenedores con lógica
- Nombres de componentes en PascalCase, archivos igual

## UI/UX (común)

- Accesibilidad: ARIA labels en elementos interactivos
- Estados de carga, error y vacío siempre implementados
- Formularios con validación client-side y feedback de error visible
- Mobile-first, diseño responsivo obligatorio
- Nunca mostrar datos parciales al usuario

## Gestión de estado (común)

- Estado local (`useState`, `ref`, signals) para estado de UI temporal
- Estado global para datos compartidos entre rutas (NgRx/Signals en Angular; nanostores o context en Astro si aplica)
- No duplicar estado: single source of truth
- Side effects en hooks/composables/services, nunca directamente en componentes

## Testing frontend

- Unit tests para lógica de componentes y hooks/services (Vitest)
- Integration tests para flujos de usuario (Playwright)
- Snapshots solo para componentes puramente visuales estables
- Cobertura mínima: 80%

## Performance (común)

- Lazy loading de rutas y componentes pesados
- Imágenes optimizadas con formatos modernos (WebP, AVIF) — en Astro vía `astro:assets` built-in (`<Image>`/`<Picture>` con servicio `sharp`; **no** usar el deprecado `@astrojs/image`); en Angular vía `NgOptimizedImage`
- No bloquear el main thread con cálculos síncronos pesados
- Bundle size monitoreado en CI

## Principios de Diseño — Frontend (Angular) — Panel de Administración

### SRP — Smart vs Dumb components

- Todo feature se divide en componentes **"smart"** (contenedores: manejan estado, llaman servicios, orquestan) y **"dumb"/presentacionales** (solo reciben `@Input()` y emiten `@Output()`, sin lógica de negocio ni llamadas a servicios). Un componente dumb no debe inyectar ningún servicio de datos.
  - Ejemplo de violación: un componente presentacional `ProductCardComponent` que inyecta `HttpClient` o `ProductApiService` directamente para resolver datos de una tarjeta de presentación.

### DIP — Inyección de servicios, no instanciación directa

- Los componentes nunca instancian `new HttpClient()` ni contienen lógica de acceso a API directamente; toda esa lógica vive en un `@Injectable({providedIn: 'root'})` Service, inyectado por constructor.
  - Ejemplo de violación: un `ProductListComponent` cuyo constructor hace `this.http = new HttpClient(...)` o que arma URLs REST dentro del `ngOnInit`.

### ISP — Selectors/Signals específicos, no el store completo

- Si usas NgRx/Signals para estado global, los componentes consumidores deben recibir solo los selectors/signals que necesitan, no el store completo inyectado.
  - Ejemplo de violación: un componente que inyecta `Store<AppState>` y encadena `store.select(state => state.products.active.items[0])` en lugar de un selector `selectActiveFirstProduct` definido y testeado en su feature.

### Umbrales Angular

- Máximo **400 líneas** por archivo de componente (`.ts`).
- Si el template inline supera **60-80 líneas**, extraer a archivo `.html` separado o dividir en sub-componentes.

## Principios de Diseño — Astro — Sitio Público (Catálogo SSG)

### SRP a nivel de componente `.astro`

- Separar el fetching de datos (idealmente delegado a una función/service importada y testeable de forma aislada) del bloque de renderizado JSX/HTML.
  - Ejemplo de violación: un componente `ProductCard.astro` cuyo frontmatter mezcla `await fetch(...)` directo a la API con transformaciones de respuesta y validaciones ad-hoc, imposibilitando testear esa lógica sin montar el componente.

### Frontmatter sin lógica de negocio no trivial

- El frontmatter de un componente `.astro` no debe contener lógica de negocio no trivial (validaciones complejas, transformaciones de datos con múltiples reglas) — esa lógica se extrae a un módulo `.ts` separado que sí pueda testearse con un test runner estándar (Vitest).
  - Ejemplo de violación: un frontmatter con un bucle de validación sobre precios, márgenes y descuentos que debería vivir en `lib/pricing/calculator.ts` con sus tests Vitest.

### SSG y Data Fetching

- El sitio público se genera en build-time (SSG). El fetching de datos del catálogo ocurre en `getStaticPaths` y/o en el frontmatter de páginas/layout via funciones de `lib/api/` que llaman al backend NestJS (`/api/v1/...`).
- Las actualizaciones de contenido disparan un nuevo build (manual desde panel admin o webhook automático).
- SEO y Core Web Vitals son prioritarios: meta tags, structured data, imágenes optimizadas, fuentes optimizadas.

### Imágenes del sitio (convención `image-assets`)

- **Ubicación**: toda imagen optimizable del sitio vive en `apps/web/src/assets/img/` y se consume en `.astro` vía `import` con el alias `@` (`@/assets/img/...`), renderizada con `<Image>`/`<Picture>` de `astro:assets`.
- **Pipeline**: `astro:assets` built-in con servicio `sharp` (declarado como dependencia de `apps/web`). **Prohibido** instalar `@astrojs/image` (deprecado). Para el `<Picture>` del hero se pasan `formats={['avif', 'webp']}` y `fallbackFormat="jpg"` explícitos (el default de Astro 7 es solo `['webp']` con fallback `png`).
- **Above-the-fold**: el hero se sirve con `loading="eager"`; imágenes bajo el fold con `loading="lazy"`.
- **Excepción 1:1**: la imagen Open Graph/Twitter (`og-image.png`, PNG 1200×630) se sirve desde `apps/web/public/` porque las redes sociales exigen URL pública absoluta, estable y formato PNG. **No** se añaden otros binarios de imagen a `public/`.
- **Iconos**: no son assets de imagen — se consumen exclusivamente vía `astro-icon` (`<Icon name="lucide:..." />`, set único Lucide para UI y marcas sociales). **Excepción única**: el logo oficial de X (Twitter) se consume vía `simple-icons:x`, ya que Lucide no provee el logo actual de X — documentado en `docs/design/style-guide/README.md`. No guardar iconos en `src/assets/img/`.

## Stack específico del proyecto

### Sitio Público (apps/web)
```
Framework: Astro 4+ (SSG)
CSS: Tailwind CSS v4
Build: Vite
Tests: Vitest + Playwright
Deploy: Docker image en VPS (Coolify) — build genera carpeta dist/ estática servida por Nginx/Node
```

### Panel Admin (apps/admin)
```
Framework: Angular 18+ (standalone components, signals)
CSS: Tailwind CSS v4
Build: Vite (angular-cli)
Tests: Vitest + Playwright
State: NgRx Signals / @ngrx/signals
Deploy: Docker image en VPS (Coolify) — build genera SPA servida por Nginx
```

### Compartido
- TypeScript 5+ strict mode
- ESLint + Prettier configurado por stack
- Path aliases configurados (`@/lib`, `@/features`, etc.)

## Design Tokens

El sistema de design tokens del proyecto se declara como entradas `@theme {}` de **Tailwind v4** en los archivos `globals.css` de cada app:

- `apps/web/src/styles/globals.css` — Sitio público Astro
- `apps/admin/src/styles/globals.css` — Panel admin Angular

Ambos archivos **DEBEN** declarar el mismo conjunto de tokens (mismos nombres y valores). La sincronización es manual (no hay paquete compartido `packages/design-tokens/` en el MVP); un test programático en `apps/admin/src/styles/__tests__/sync.test.ts` valida la paridad y rompe si alguien edita uno sin el otro.

**Fuente canónica:** `docs/design/style-guide/README.md` contiene la tabla completa de tokens (24 colores marca + neutros + estado, 2 tipografías Montserrat/Open Sans self-hosted via `@fontsource`, radio `0` — flat design estricto, ángulos rectos, 5 sombras) y el catálogo de iconos (Lucide, set único, para UI y marcas sociales).

**Convención de consumo:** usar exclusivamente las utilities Tailwind generadas desde `@theme` (`bg-primary`, `text-secondary`, `border-border`, `font-heading`, `rounded`, `shadow-2`, etc.). **Queda prohibido** usar literales hex (`#XXXXXX`) o los tokens obsoletos `brand-*` en componentes, páginas o configs.

**Iconos:** se consumen vía `astro-icon` + Iconify (`<Icon name="lucide:..." />`, set único Lucide — outline, stroke 2px — para UI y marcas sociales). Los iconos SVG inline locales (`.astro` en `components/icons/`) están prohibidos. **Excepción única documentada**: el logo oficial de X (Twitter) usa `simple-icons:x` (Lucide no provee el logo actual de X; el `lucide:x` es un icono de cerrar, no la marca). Ver catálogo canónico en `docs/design/style-guide/README.md`.
