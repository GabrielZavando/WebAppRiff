## Context

The Riff public site is an Astro **SSG** app: `astro build` produces static HTML in `dist/`, served by Nginx/Node on the VPS via Coolify. `SearchForm.astro` is a dumb presentational component that receives `categories` via props, currently sourced from the hardcoded `CATEGORY_OPTIONS` constant in `lib/config/search-form.ts` and wired in `Layout.astro`.

The backend (NestJS BFF) already exposes `GET /api/v1/categories?activa=true` (public) and authenticated write endpoints for categories. The Astro app enforces a hard rule: component frontmatter MUST NOT contain `fetch(` or `import.meta.env` (enforced by component tests); data fetching must live in `lib/` modules.

Goal: make the search dropdown dynamic (from the DB) and keep it fresh when an admin edits categories, **without** introducing per-page-load API calls (SSG already bakes the HTML) and **without** manual rebuilds.

## Goals / Non-Goals

**Goals:**
- Source the SearchForm category list from the backend at build time.
- Keep the `"Todas las categorías"` default option and stable ordering.
- Notify (from the backend) when a category changes, so the static site rebuilds and picks up the new list.
- Keep the build resilient (never fail if the API is unreachable).

**Non-Goals:**
- No runtime/per-visit fetching of categories (no SWR, no client polling of categories).
- No piggybacking category freshness onto the product-search API call (the webhook already covers freshness; coupling would add complexity without benefit).
- Product catalog / search results UI is out of scope (separate future change).

## Decisions

### D1 — Build-time fetch, not runtime fetch
**Decision:** Fetch categories in `lib/api/categories.ts` during `astro build` (called from `Layout.astro` frontmatter) and bake them into the static HTML.
**Rationale:** SSG already eliminates per-load API calls; build-time fetch keeps the dropdown dynamic while preserving that property. A runtime client fetch would require JS and degrade the no-JS experience, and contradicts the project's SSG model.
**Alternatives considered:** (a) Client-side SWR/localStorage cache — rejected: needs JS, degrades no-JS, adds complexity; (b) SSR/ISR per-request cache — rejected: bigger architectural change, not needed for a rarely-changing, tiny list.

### D2 — Module-level cache (one fetch per build)
**Decision:** `lib/api/categories.ts` keeps a module-scoped `cached` variable; the first call fetches and caches, subsequent calls reuse it.
**Rationale:** `Layout.astro` is used by every page; without caching the build would call the API once per page. A single Node process builds all pages, so module-level state is shared.

### D3 — Safe fallback
**Decision:** On fetch/parse error, return only `[{ id: "", label: "Todas las categorías" }]` and `console.warn`.
**Rationale:** A missing backend at build time must not break the static build; the dropdown gracefully degrades to the default option.

### D4 — Backend notifier as an injected Strategy (OCP/DIP)
**Decision:** Define `ICategoryChangeNotifier` port in `categorias/domain`; implement `WebhookCategoryChangeNotifier` in `categorias/infrastructure`; inject via token `I_CATEGORY_CHANGE_NOTIFIER` in `CategoriasModule`. `CategoriaService` depends only on the abstraction.
**Rationale:** Adding a new notification transport (e.g. queue, another webhook) means a new Strategy, not editing the service — satisfies OCP and DIP per backend-standards. Keeps domain/application free of HTTP/SDK imports.

### D5 — Fire-and-forget, no-op when unset, swallow errors
**Decision:** The service calls `this.notifier.notifyChange(event)` without awaiting; the notifier returns without throwing even on transport failure (logs a warning).
**Rationale:** A category mutation must not fail or slow down because the webhook is down. The rebuild is best-effort; eventual consistency is acceptable for infrequently-changing data.

## Risks / Trade-offs

- **[Risk] Backend unreachable during `astro build`** → Mitigation: safe fallback (D3) keeps the build green; the next successful rebuild will pick up categories.
- **[Risk] Rebuild lag window** → Between a category edit and the Coolify rebuild completing, the public dropdown may be briefly stale. → Mitigation: acceptable for rarely-changing data; Coolify build times are short. No per-request check needed.
- **[Risk] Webhook misconfigured / fires on unrelated deploys** → Mitigation: `CATEGORIES_WEBHOOK_URL` is opt-in (no-op when unset); point it only at the Astro site's deploy hook.
- **[Risk] Circular rebuild loop** → A rebuild re-reads categories (read-only), it does not mutate them, so no loop.

## Migration Plan

1. Add `CATEGORIES_WEBHOOK_URL` to the backend environment (Coolify env / `.env`). Point it at the Astro app's Coolify deploy webhook.
2. Deploy backend (notifier active, no-op until env set).
3. Deploy frontend; `astro build` fetches live categories.
4. From then on, any category create/update/delete in the admin triggers an automatic site rebuild.
5. Rollback: remove the webhook URL (notifier becomes no-op) and redeploy; categories remain baked from the last successful build.

## Open Questions

- None. Scope and strategy are confirmed with the user (build-time + webhook→rebuild, active-only, safe fallback).
