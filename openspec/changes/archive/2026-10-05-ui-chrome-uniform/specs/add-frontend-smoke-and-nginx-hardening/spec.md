# add-frontend-smoke-and-nginx-hardening Specification

## MODIFIED Requirements

### Requirement: Nginx SHALL enforce cache policy and security headers
`apps/web/nginx.conf` and `apps/admin/nginx.conf` SHALL serve content-hashed assets (`/_astro/*` for web, `/assets/*` for admin) with `Cache-Control: public, max-age=31536000, immutable`; HTML (including `index.html` and the SPA fallback) with `no-cache`; and every HTML document SHALL carry the security headers `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and a compatible base Content-Security-Policy repeated explicitly in each `location` that defines an `add_header`. The CSP `font-src` directive SHALL be `font-src 'self' https: data:` — the `data:` source allows the self-hosted `@fontsource` fonts that the build inlines as base64 data URIs (change `ui-chrome-uniform`); the other CSP directives remain unchanged. (MODIFIED in `ui-chrome-uniform`.)

#### Scenario: CSP font-src allows embedded fonts
- **WHEN** any `location` in `apps/web/nginx.conf` or `apps/admin/nginx.conf` emits the `Content-Security-Policy` header
- **THEN** the `font-src` directive is `'self' https: data:`
- **AND** the remaining directives (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `object-src`, `base-uri`, `form-action`) are unchanged

#### Scenario: Security headers present on every document
- **WHEN** nginx serves any HTML document
- **THEN** it includes `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` and the base CSP
- **AND** the headers + CSP are repeated explicitly in each `location` that defines its own `add_header` (nginx `add_header` inheritance)