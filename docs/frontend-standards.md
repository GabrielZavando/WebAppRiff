# Frontend Standards

> Personalizar este archivo con el stack frontend real del proyecto.

## Componentes

- Un componente = una responsabilidad
- Props tipadas explícitamente, sin `any`
- Estados locales para UI, stores globales para dominio
- Componentes presentacionales separados de contenedores con lógica
- Nombres de componentes en PascalCase, archivos igual

## UI/UX

- Accesibilidad: ARIA labels en elementos interactivos
- Estados de carga, error y vacío siempre implementados
- Formularios con validación client-side y feedback de error visible
- Mobile-first, diseño responsivo obligatorio
- Nunca mostrar datos parciales al usuario

## Gestión de estado

- Estado local (`useState`, `ref`) para estado de UI temporal
- Estado global para datos compartidos entre rutas
- No duplicar estado: single source of truth
- Side effects en hooks/composables, nunca directamente en componentes

## Testing frontend

- Unit tests para lógica de componentes y hooks
- Integration tests para flujos de usuario
- Snapshots solo para componentes puramente visuales estables
- Cobertura mínima: 80%

## Performance

- Lazy loading de rutas y componentes pesados
- Imágenes optimizadas con formatos modernos (WebP, AVIF)
- No bloquear el main thread con cálculos síncronos pesados
- Bundle size monitoreado en CI

## Principios de Diseño — Frontend (Angular)

### SRP — Smart vs Dumb components

- Todo feature se divide en componentes **"smart"** (contenedores: manejan estado, llaman servicios, orquestan) y **"dumb"/presentacionales** (solo reciben `@Input()` y emiten `@Output()`, sin lógica de negocio ni llamadas a servicios). Un componente dumb no debe inyectar ningún servicio de datos.
  - Ejemplo de violación: un componente presentacional `UserCardComponent` que inyecta `HttpClient` o `CustomerApiService` directamente para resolver datos de una tarjeta de presentación.

### DIP — Inyección de servicios, no instanciación directa

- Los componentes nunca instancian `new HttpClient()` ni contienen lógica de acceso a API directamente; toda esa lógica vive en un `@Injectable({providedIn: 'root'})` Service, inyectado por constructor.
  - Ejemplo de violación: un `UserListComponent` cuyo constructor hace `this.http = new HttpClient(...)` o que arma URLs REST dentro del `ngOnInit`.

### ISP — Selectors/Signals específicos, no el store completo

- Si usas NgRx/Signals para estado global, los componentes consumidores deben recibir solo los selectors/signals que necesitan, no el store completo inyectado.
  - Ejemplo de violación: un componente que inyecta `Store<AppState>` y encadena `store.select(state => state.orders.active.items[0])` en lugar de un selector `selectActiveFirstItem` definido y testeado en su feature.

### Umbrales

- Máximo **400 líneas** por archivo de componente (`.ts`).
- Si el template inline supera **60-80 líneas**, extraer a archivo `.html` separado o dividir en sub-componentes.

## Principios de Diseño — Astro

### SRP a nivel de componente `.astro`

- Separar el fetching de datos (idealmente delegado a una función/service importada y testeable de forma aislada) del bloque de renderizado JSX/HTML.
  - Ejemplo de violación: un componente `ProductCard.astro` cuyo frontmatter mezcla `await fetch(...)` directo a la API con transformaciones de respuesta y validaciones ad-hoc, imposibilitando testear esa lógica sin montar el componente.

### Frontmatter sin lógica de negocio no trivial

- El frontmatter de un componente `.astro` no debe contener lógica de negocio no trivial (validaciones complejas, transformaciones de datos con múltiples reglas) — esa lógica se extrae a un módulo `.ts` separado que sí pueda testearse con un test runner estándar.
  - Ejemplo de violación: un frontmatter con un bucle de validación sobre precios, márgenes y descuentos que debería vivir en `pricing/calculator.ts` con sus tests Vitest.

## Stack específico del proyecto

> Reemplazar con el stack real:

```
Framework: Astro / React / Vue / Next.js
CSS: Tailwind CSS v4
Build: Vite
Tests: Vitest / Playwright
Deploy: Cloudflare Pages / Vercel / Netlify
```
