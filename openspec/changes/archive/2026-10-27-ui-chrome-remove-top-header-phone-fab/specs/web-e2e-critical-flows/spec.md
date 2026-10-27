# web-e2e-critical-flows Specification

## REMOVED Requirements

### Requirement: Existing 8 landing specs remain green
**Reason**: `top-header.spec.ts` se elimina; la suite queda en 7 specs existentes y suma `phone-fab.spec.ts`.

**Migration**: La cobertura landing se mantiene en el requisito nuevo, con el FAB de teléfono incluido.

## ADDED Requirements

### Requirement: Landing E2E suite remains green after removing top-header
The 7 remaining Playwright landing specs in `apps/web/e2e/` (hero-banner, site-header, site-header-scroll, search-form, panel-home, services-section, solution-section) plus the new `phone-fab.spec.ts` SHALL continue to pass with the stub API present in the webServer.

#### Scenario: Landing specs pass with stub
- **WHEN** `npx playwright test --project=chromium` is executed with the stub API running
- **THEN** all 7 existing landing specs pass (no failures)
- **AND** `phone-fab.spec.ts` passes and asserts the phone FAB link, position and accessible name
- **AND** `top-header.spec.ts` does not exist in the suite
