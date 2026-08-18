## Context

`descripcionLarga` is modeled as `string (HTML)`; `descripcionBreve` as a plain string. The seed of 71 products (migrated from WordPress/Divi) shows: 67/71 `descripcionLarga` contain real HTML, 2/71 are double-escaped; 12/71 `descripcionBreve` contain stray HTML, 2/71 double-escaped. Today the backend (`apps/backend`) returns these strings verbatim, and the public Astro site (`apps/web`) renders `descripcionBreve` via escaped interpolation and does not render `descripcionLarga` at all. The Angular admin is a placeholder and is out of scope.

Constraints:
- Backend must respect Clean Architecture / DIP — `domain`/`application` never import infra packages (`sanitize-html`, `he`). Sanitization is an infrastructure adapter behind a domain port.
- Frontend is Astro SSG: rendering happens at build time in Node, so sanitization at render time runs in Node (no browser runtime needed).
- Design tokens (Tailwind v4 `@theme`) are the only allowed color/typography source; raw hex is forbidden.

## Goals / Non-Goals

**Goals:**
- `descripcionLarga` renders as safe, formatted HTML on the public product detail page.
- `descripcionBreve` always renders as clean plain text (cards + meta description).
- One sanitization policy shared by backend (write) and frontend (render).
- Existing Firestore data normalized without loss of intended formatting.

**Non-Goals:**
- Building the Angular admin rich-text editor (deferred — admin is a placeholder).
- Rendering `descripcionLarga` inside catalog cards/list items (only the detail page).
- Changing the product data model field types (`descripcionLarga` stays HTML, `descripcionBreve` stays plain text).

## Decisions

1. **Shared workspace package `@riff/html-sanitize` (single source of truth).**
   Exports `sanitizeRichHtml(dirty)` and `stripHtmlToText(dirty)` plus `RICH_HTML_CONFIG`. Rationale: the allowlist is a security policy; duplicating it in two apps risks drift. Both consumers run in Node, so a shared TS package is natural. Alternative considered: duplicate config per app — rejected (security drift). Build concern (workspace package normally needs its own build) is resolved by mapping `@riff/html-sanitize` via `tsconfig` `paths` to `packages/html-sanitize/src/index.ts` in both apps — no separate compile step.

2. **Sanitize on write AND on render (defense in depth).**
   Backend sanitizes before persisting (DB holds safe HTML); frontend re-sanitizes in the mappers as belt-and-suspenders for any not-yet-migrated record. Both call the same shared package.

3. **`descripcionBreve` → plain text, `descripcionLarga` → HTML.**
   Matches the data model (plain string vs HTML) and the UI context (card/meta vs full detail body).

4. **Backend wiring via DIP.**
   `IHtmlSanitizer` port lives in `productos/domain`; `HtmlSanitizerService` adapter in `productos/infrastructure` delegates to `@riff/html-sanitize` and is registered by token. `ProductoWriteService` receives it by constructor (≤3 deps) and sanitizes both fields before the repository call, on create and update.

5. **Sanitization allowlist (concrete).**
   - Allowed tags: `p, br, strong, b, em, i, u, ul, ol, li, a, blockquote, h2, h3, h4`.
   - Allowed attributes: only `a[href, target, rel]`; `rel` forced to `noopener noreferrer` on links (transformer).
   - `div` transformed to `p` (cleans Divi `et_pb_*` wrappers); `style`, `class`, `id` and all `on*` event handlers stripped.
   - `he.decode` runs before sanitizing to fix double-escaped `&lt;…&gt;`.
   - `stripHtmlToText`: decode → strip all tags → collapse whitespace → trim.

6. **Frontend render + styling.**
   `[slug].astro` renders `descripcionLarga` with `<div class="rich-text" set:html={model.descripcionLarga} />` after the short-description `<p>`. `.rich-text` scoped CSS in `globals.css` uses token utilities only (`@apply font-body text-text-2 …`, `list-disc`, `text-primary underline`, etc.), respecting flat design (radius 0, no raw hex).

7. **One-time migration.**
   CLI script `apps/backend/src/cli/normalize-descriptions.ts` (npm `migrate:descriptions`, flag `--dry-run`) reads all `productos`, applies `sanitizeRichHtml`/`stripHtmlToText`, writes back only on change. Idempotent.

## Risks / Trade-offs

- **Divi markup noise** → mitigated by `div→p` + class/style strip + unit tests asserting no `class="et_pb*"` survives.
- **Shared-package resolution in `nest build`** → mitigated by `tsconfig` `paths` to source; fallback if prod build fails to inline: build the package separately or duplicate the (small) config with an identical contract test in each app.
- **Content change in API responses** → `descripcionLarga` now returns a safe subset (formatting preserved); `descripcionBreve` returns plain text. Documented in `api-spec.yml`; no consumers break structurally.
- **Migration is destructive to raw stored HTML** → mitigated by `--dry-run` preview and a Firestore export taken before running.

## Migration Plan

1. Take a Firestore export (backup) of `productos`.
2. `npm run migrate:descriptions -- --dry-run` → confirm count of records that will change.
3. `npm run migrate:descriptions` → normalize in place (idempotent).
4. Rebuild the public site (`npm run build --workspace=apps/web`) so `descripcionLarga` is rendered.
5. **Rollback**: restore the Firestore export; re-run seed if needed.

## Open Questions

- None blocking. When the Angular admin editor is built, it should reuse `@riff/html-sanitize` and only bind `descripcionLarga` via `DomSanitizer`/`bypassSecurityTrustHtml` **after** server sanitization.
