## MODIFIED Requirements

### Requirement: Header renders logo at 2× size with overflow
The site-header SHALL render a logo link pointing to the home page, wrapping the real raster logo imported from `@/assets/img/` (`logo-web.webp`) and rendered with the built-in `astro:assets` `<Image>` component. The `<img>` SHALL carry the `alt` text from the `logoAlt` prop and **double** the previous `width`/`height` attributes (from `165`/`67` to `330`/`134`). The `<img>` SHALL use a responsive max-width so it scales proportionally: `max-w-[200px]` on mobile viewports and `max-w-[300px]` from the `sm` breakpoint (>= 640px) upward, combined with `w-full` so it occupies available width up to the cap while preserving the aspect ratio defined by `width`/`height`. The wrapping `<a>` SHALL use `overflow-visible` with a responsive constrained height: `h-20` on mobile/tablet (viewport < 1024px) and `lg:h-24` on desktop (>= 1024px), so the header is shorter on small screens. The `<img>` SHALL additionally carry `max-h-full` (removed via `lg:max-h-none` on desktop) so on mobile/tablet it never exceeds the header height, preventing the header from growing when the width-capped logo would be taller than the header. On desktop the original 2× overflow behaviour is restored. The placeholder text "Logo placeholder" SHALL no longer appear. The header container SHALL use the `--color-secondary` (navy `#1F2D40`) and `--color-secondary-light` (`#35455E`) tokens via Tailwind utilities `bg-linear-to-r from-secondary to-secondary-light`; the obsolete utilities `bg-brand-navy`, `from-brand-navy`, `to-brand-navy-light` SHALL NOT appear.

#### Scenario: Logo link points to home
- **WHEN** the site-header renders
- **THEN** the logo link has `href="/"` and `aria-label="Ir al inicio"`
- **AND** the logo link is inside a container with a gradient `from-secondary to-secondary-light`
- **AND** the rendered HTML contains no `brand-navy` token references

#### Scenario: Logo image is the real raster asset at 2x size with overflow
- **WHEN** the site-header renders
- **THEN** the logo link contains an `<img>` element whose `src` resolves to the imported asset from `@/assets/img/` (`logo-web.webp`, 600×243 native)
- **AND** the `<img>` carries `alt="Riff"` (the `logoAlt` prop value)
- **AND** the `<img>` carries explicit `width="330"` and `height="134"` attributes (2× the previous 165×67)
- **AND** the `<a>` wrapper has `overflow-visible` and a responsive constrained height (`h-20 lg:h-24`)
- **AND** the `<img>` carries `max-h-full` so it never exceeds the header height on mobile/tablet
- **AND** the rendered HTML does NOT contain "Logo placeholder"

#### Scenario: Logo image uses responsive max-width
- **WHEN** the site-header renders
- **THEN** the `<img>` carries `w-full` so it fills available width up to its cap
- **AND** the `<img>` carries `max-w-[200px]` to cap width at 200px on mobile
- **AND** the `<img>` carries `sm:max-w-[300px]` to cap width at 300px from the `sm` breakpoint upward
- **AND** the `<img>` carries `max-h-full` (mobile/tablet) so it cannot exceed the header height
- **AND** the `<img>` carries `lg:max-h-none` to restore the 2× overflow on desktop
- **AND** the `<img>` still carries explicit `width="330"` and `height="134"` attributes (aspect ratio preserved)
