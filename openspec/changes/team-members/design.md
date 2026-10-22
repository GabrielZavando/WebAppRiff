# Design

## Context

Estado actual relevante (verificado en el código):

- La Home renderiza `NosotrosTeamSection.astro` alimentado por `NOSOTROS_TEAM_SECTION_CONTENT` (`src/lib/config/nosotros-team-section.ts`): 3 personas ficticias, tarjetas con foto 380x502, overlay degradado, nombre/cargo sobre la imagen, hover grayscale → color y offset de la tarjeta central en desktop.
- `/nosotros` renderiza `NosotrosTeamGrid.astro` como quinta sección, alimentado por `NOSOTROS_PAGE_CONTENT.team` (`src/lib/config/nosotros-page.ts`): 4 personas ficticias, tarjetas con `aspect-square`, badge de área, nombre/cargo/descripción y pie con icono Lucide.
- Existen dos interfaces `TeamMember` homónimas y con formas distintas (`src/lib/types/nosotros-team-section.ts` y `src/lib/types/nosotros-page.ts`). La de la Home usa una unión cerrada `TeamMemberRole` + `getTeamMemberRoleLabel()`; la de `/nosotros` usa `area`, `areaTone`, `footerLabel` y `footerIcon`.
- Los specs actuales fijan contenido ficticio: `team-section` exige 3 miembros concretos y `nosotros-page` (SC-206) exige 4. Ambos deben actualizarse.
- El cliente entregó 8 fotos definitivas en `apps/web/src/assets/img/nosotros/`, todas de 900x1200 (3:4) y con nombres kebab-case ASCII.

## Goals / Non-Goals

**Goals:**

- Una única fuente de datos para los 8 integrantes, compartida por la Home y `/nosotros`.
- Selección explícita de los 3 destacados de la Home mediante `isFeatured`.
- Reemplazar el contenido ficticio por el roster real, con copy y cargos exactos.
- Mantener el diseño editorial de la Home y simplificar la tarjeta de `/nosotros` a foto, nombre, cargo y descripción.
- Dejar el cambio cubierto por tests TDD y specs delta coherentes.

**Non-Goals:**

- No crear un componente `TeamMemberCard` compartido: se mantienen los dos componentes actuales.
- No tocar el backend, la API, Firestore, el panel admin ni el Layout/Header/Footer.
- No añadir un CMS ni edición dinámica del equipo.
- No cambiar el sistema de design tokens ni introducir dependencias nuevas.
- No implementar código en esta fase: el change queda listo para `/opsx-apply`.

## Decisions

### D1 — Fuente única de datos, sin componente compartido

**Elección**: crear `src/lib/types/team.ts` y `src/lib/config/team.ts` con el roster canónico. La Home y `/nosotros` siguen usando sus dos componentes actuales, pero ambos reciben los mismos objetos `TeamMember`.

```
src/lib/config/team.ts
  TEAM_MEMBERS (8, orden canonico)
  FEATURED_TEAM_MEMBERS = TEAM_MEMBERS.filter(m => m.isFeatured) (3)
        |                                   |
        v                                   v
NOSOTROS_TEAM_SECTION_CONTENT          NOSOTROS_PAGE_CONTENT.team
        |                                   |
        v                                   v
NosotrosTeamSection.astro              NosotrosTeamGrid.astro
(Home, overlay editorial)              (/nosotros, tarjeta simple)
```

**Rationale**: elimina la duplicación real (datos, fotos, copy) sin forzar una abstracción de UI que el cliente descartó explícitamente. Cada componente conserva su diseño y sus tests.

**Alternativas descartadas**:

- Un `TeamMemberCard.astro` compartido: descartado por decisión del cliente; home y nosotros tienen tratamientos visuales distintos.
- Un `TeamSection.astro` único con variantes: sobreabstracción; los headers, grids y tarjetas difieren.

### D2 — Contrato `TeamMember`

**Elección**:

```ts
export interface TeamMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly description: string;
  readonly image: ImageMetadata;
  readonly imageAlt: string;
  readonly isFeatured: boolean;
}
```

- `id`: slug estable (`ruby-barrientos`, …) para keys de tests y futuras integraciones.
- `role`: texto visible exacto del cargo. Se elimina la unión cerrada `TeamMemberRole` y `getTeamMemberRoleLabel()`: con 8 cargos únicos el mapeo kebab-case → etiqueta no aporta valor y duplica datos.
- `description`: copy exacto entregado por el cliente.
- `image`: `ImageMetadata` importado desde `@/assets/img/nosotros/`.
- `imageAlt`: descripción de la foto, no el nombre literal.
- `isFeatured`: marca los 3 que aparecen en la Home.

**Rationale**: un solo contrato readonly, sin `any`, alineado con TypeScript strict y con el patrón de configs tipadas del proyecto. El orden canónico del array es el orden de render en `/nosotros` y de los destacados en la Home.

**Trade-off**: se pierde la seguridad de la unión cerrada para los cargos. Se compensa con tests que comparan los 8 textos exactos; el copy es contenido, no lógica.

### D3 — Home: mantener el overlay y añadir la descripción dentro de él

**Elección**: conservar la tarjeta actual (`aspect-[380/502]`, `object-cover`, overlay `bg-linear-to-b from-secondary/40 via-secondary/75 via-[67%] to-secondary/95`, nombre blanco, cargo uppercase en `text-primary`, hover grayscale → color con `scale3d`, offset central `lg:translate-y-8`) y añadir un `<p>` con la descripción debajo del cargo, dentro del contenedor inferior del overlay.

- Tipografía: `font-body text-xs leading-relaxed text-white/90`.
- No se trunca el texto: las 8 descripciones caben en el tercio inferior de la tarjeta a 380 px de ancho.
- El hover y el overlay no cambian: la descripción es texto estático sobre el mismo gradiente.
- Se mantiene un solo `<h2>` de sección; los nombres siguen siendo `<span>` (no se introducen `<h3>` en la Home).

**Rationale**: cumple el requisito de descripción sin romper el diseño aprobado ni la composición de 3 columnas. Mantiene el efecto editorial que el cliente pidió conservar.

**Mitigación**: si en revisión visual el copy no cabe o pierde legibilidad, la descripción puede moverse a un bloque bajo la foto dentro de la misma tarjeta; el contrato de datos no cambia.

### D4 — `/nosotros`: tarjeta simplificada y foto 3:4

**Elección**: en `NosotrosTeamGrid.astro`:

- Eliminar el badge de área sobre la foto y el pie con icono.
- Eliminar del contrato `area`, `areaTone`, `footerLabel` y `footerIcon`.
- Renderizar: foto, `<h3>` nombre, cargo uppercase y descripción.
- Cambiar el contenedor de la foto de `aspect-square` a `aspect-[3/4]`, para respetar la proporción real de las 8 fotos (900x1200).
- Mantener: grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, header con eyebrow/título/subtítulo, badge de acreditación de la sección, hover/zoom y shadow sutil de tarjeta.
- Mostrar la foto en color natural, sin filtro `grayscale` (feedback del cliente: el equipo de `/nosotros` debe verse a color).

**Rationale**: el requisito pide solo cuatro datos por tarjeta. La proporción 3:4 evita recortes agresivos de las fotos entregadas y mantiene coherencia con la Home.

**Alternativa descartada**: conservar `aspect-square` y recortar las fotos; se perdería parte del encuadre y no se aprovecharía la proporción ajustada por el cliente.

### D5 — Mapeo de imágenes y pipeline `astro:assets`

Mapeo canónico (orden de render):

| # | id | Integrante | Cargo | Archivo | Destacado |
|---|---|---|---|---|---|
| 1 | `ruby-barrientos` | Ruby Barrientos | Directora · Gerenta Comercial | `ruby-barrientos.jpg` | sí |
| 2 | `felipe-roman` | Felipe Román | Gerente de Operaciones | `felipe-roman.jpg` | sí |
| 3 | `patricio-barrientos` | Patricio Barrientos | Ingeniero Químico · Asesor Técnico | `patricio-barrientos.jpg` | sí |
| 4 | `francisco-mehech` | Francisco Mehech | Coordinador de Servicios y Logística | `francisco-mehech.jpg` | no |
| 5 | `eric-perez` | Eric Pérez | Responsable de Ingeniería y Puesta en Marcha | `eric-perez.jpg` | no |
| 6 | `loredana-quiroga` | Loredana Quiroga | Líder de Ventas Técnicas y Licitaciones | `loredana-quiroga.jpg` | no |
| 7 | `francys-padra` | Francys Padra | Responsable de Desarrollo Comercial | `francys-padra.jpg` | no |
| 8 | `melany-bravo` | Melany Bravo | Coordinadora de Gestión Interna | `melany-bravo.jpg` | no |

- Importar cada archivo con el alias `@/assets/img/nosotros/<archivo>`.
- Renderizar con `<Image>` de `astro:assets`; Astro 7 usa WebP como formato de salida por defecto (`sharp`).
- `loading="lazy"` y `decoding="async"` en todas las tarjetas (están bajo el fold).
- `alt` descriptivo y distinto del nombre literal (p. ej. "Retrato de Ruby Barrientos en oficina corporativa de Riff").
- Opcional de performance: `widths={[360, 720]}` + `sizes` acorde al grid; no cambia el contrato.

**Rationale**: las fotos ya están normalizadas a 900x1200; `astro:assets` las optimiza y convierte en build. No se requieren binarios en `public/` ni un servicio de imágenes externo.

### D6 — Cableado de configuraciones

- `src/lib/config/team.ts` define `TEAM_MEMBERS` y `FEATURED_TEAM_MEMBERS`.
- `src/lib/config/nosotros-team-section.ts` importa `FEATURED_TEAM_MEMBERS` y lo asigna a `members`; conserva `headline`, `subtitle` y `eyebrow`.
- `src/lib/config/nosotros-page.ts` importa `TEAM_MEMBERS` y lo asigna a `team.members`; conserva header y badge de la sección.
- `src/lib/types/nosotros-team-section.ts` y `src/lib/types/nosotros-page.ts` importan `TeamMember` desde `@/lib/types/team`; se eliminan las definiciones duplicadas y los campos de área/pie.
- No se duplican literales de integrantes en ninguna de las dos configuraciones.

### D7 — Estrategia de tests (TDD)

Orden de implementación:

1. Tests de `team.ts`: 8 miembros, orden canónico, ids únicos, cargos/descripciones exactos, 3 destacados (Ruby, Felipe, Patricio), imágenes correctas y `alt` no vacíos.
2. Tests de tipos: `TeamMember` readonly, `role` string, `isFeatured` boolean; los configs son asignables.
3. Tests de componentes: Home renderiza 3 destacados con descripción dentro del overlay; `/nosotros` renderiza 8 tarjetas sin badge de área ni pie, con foto 3:4 y descripción.
4. Tests de página: `/nosotros` sigue renderizando 6 secciones y el equipo real.
5. Actualizar tests existentes que afirman los nombres ficticios, `f-1.jpg`…`f-3.jpg`, roles de la unión cerrada y los pies de tarjeta.

### D8 — Deltas de specs

- `team-roster` (nueva): contrato de datos y copy canónico.
- `team-section` (`MODIFIED`): contenido real y descripción en la tarjeta; contrato `TeamMember` compartido; se conservan header, grid, hover, reduced motion y tokens.
- `nosotros-page` (`REMOVED` + `ADDED`): se retira el requirement de 4 tarjetas ficticias y se añade el de 8 tarjetas reales simplificadas. El requirement responsive SC-211 no cambia (`1 → 2 → 4`).

## Risks / Trade-offs

- **Descripción larga en el overlay de la Home** → Validar visualmente con las 8 descripciones; si no cabe, moverla a un bloque bajo la foto dentro de la tarjeta (D3).
- **Pérdida de la unión cerrada de roles** → Tests de copy exacto para los 8 cargos; el riesgo de typo queda cubierto por test, no por tipo.
- **Fotos 3:4 en `/nosotros`** → Cambiar `aspect-square` a `aspect-[3/4]`; si se mantiene el cuadrado, se recortan los retratos.
- **Tests existentes acoplados al mockup** → Reescribirlos primero (TDD); no hacer que los tests nuevos dependan de `f-1.jpg`…`f-3.jpg`.
- **Assets `f-1.jpg`…`f-3.jpg` quedan sin uso** → Verificar que no se usen en otra sección y eliminarlos o dejarlos documentados como legado; no bloquear el change por esto.
- **`/nosotros` con 8 tarjetas y 4 columnas** → En tablet quedan 2 columnas y 4 filas; validar que el header/badge no se desborde y que el grid mantenga gap uniforme.

## Migration Plan

- No hay migración de datos ni cambios de infraestructura: el sitio es SSG y el roster es contenido hardcodeado.
- Despliegue: rebuild de `apps/web`; las imágenes se optimizan en el build.
- Rollback: revertir el change completo; las fotos nuevas son aditivas y no afectan otras páginas.
- Orden sugerido: datos/tipos → tests → Home → `/nosotros` → validación estricta.

## Open Questions

- Ninguna bloqueante. La única interpretación de diseño es la ubicación de la descripción dentro del overlay de la Home (D3); queda documentada y es reversible sin cambiar datos.
