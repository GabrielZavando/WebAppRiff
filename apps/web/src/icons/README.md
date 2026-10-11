# src/icons

**No hay iconos locales en este proyecto.** Todos los iconos provienen de las
colecciones de Iconify (`@iconify-json/lucide`, `@iconify-json/simple-icons`)
consumidas por astro-icon.

Esta carpeta existe (con `.gitkeep`) porque astro-icon v1 carga su colección
local desde `src/icons` por defecto y emite un warning en cada build
(`Failed to load icons from "src/icons"`) cuando la carpeta no existe. Con la
carpeta vacía presente, el build resuelve la colección local vacía sin warnings.

No agregar SVGs aquí salvo que se decida explícitamente soportar iconos locales.
