# generalize-catalog-rebuild-webhook Specification

## Purpose
TBD - created by archiving change generalize-catalog-rebuild-webhook. Update Purpose after archive.
## Requirements
### Requirement: Catalog changes SHALL trigger a rebuild notification
The backend SHALL notify a configured rebuild webhook whenever a public catalog
entity changes: a category, a subcategory (created/updated/deleted), or a product
(created/updated — including publish/unpublish via its `publicado` field — or
deleted). The notification SHALL be fire-and-forget and MUST NOT block or fail the
mutating operation.

#### Scenario: Category change triggers a rebuild event
- **WHEN** a category is created, updated, or deleted successfully
- **THEN** a `category` event with the affected id, the action and `occurredAt` is notified to the webhook
- **AND** the mutation responds without waiting on or depending on the webhook

#### Scenario: Subcategory change triggers a rebuild event
- **WHEN** a subcategory is created, updated, or deleted successfully
- **THEN** a `subcategory` event is notified
- **AND** the mutation is non-blocking on the webhook

#### Scenario: Product change triggers a rebuild event (incl. publish/unpublish)
- **WHEN** a product is created, updated (incl. toggling `publicado`), or deleted
- **THEN** a `product` event with the corresponding action is notified
- **AND** the mutation is non-blocking on the webhook

### Requirement: The webhook SHALL authenticate with Bearer and a timeout
The notifier SHALL read `CATALOG_REBUILD_WEBHOOK_URL` and
`CATALOG_REBUILD_WEBHOOK_TOKEN` and send `POST` with
`Authorization: Bearer <token>` and `content-type: application/json`, aborted after
a configurable timeout. It SHALL be a no-op when the URL is unset, SHALL never
throw, and SHALL log errors as warnings without leaking the token or the full URL.

#### Scenario: Request is authenticated with the bearer token
- **WHEN** the notifier sends the event
- **THEN** the request includes `Authorization: Bearer <token>` and `content-type: application/json`
- **AND** the token never appears in logs or the request body

#### Scenario: Request times out without blocking
- **WHEN** the webhook does not respond within the timeout
- **THEN** the request is aborted and the timeout is logged as a warning without secrets

#### Scenario: Unset URL is a no-op
- **WHEN** `CATALOG_REBUILD_WEBHOOK_URL` is not set and a catalog mutation occurs
- **THEN** the notifier sends nothing and the mutation proceeds without error

#### Scenario: Webhook failure does not fail the mutation
- **WHEN** the webhook returns an error or is unreachable
- **THEN** the catalog mutation succeeds and the error is recorded as a warning

### Requirement: The notifier SHALL surface HTTP failures (no silent failure)
The notifier SHALL inspect `response.ok` after `fetch`. When the webhook responds
with a non-OK HTTP status (4xx/5xx), it SHALL log a warning with the HTTP status
and the entity type/action, without leaking the token or the URL, and SHALL NOT
throw or fail the catalog mutation.

#### Scenario: Non-OK HTTP status is logged as a warning
- **WHEN** the webhook resolves with `response.ok === false` (e.g. HTTP 401 or 500)
- **THEN** a warning is logged with the HTTP status and entity type/action
- **AND** the token and URL are not in the message
- **AND** the catalog mutation still succeeds

### Requirement: Environment contract SHALL use CATALOG_REBUILD_*
`.env.example` (root and backend) and `docs/deploy-standards.md` SHALL document
`CATALOG_REBUILD_WEBHOOK_URL` and `CATALOG_REBUILD_WEBHOOK_TOKEN` as the rebuild
webhook contract, replacing `CATEGORIES_WEBHOOK_URL`, which SHALL have no remaining
reference in code or docs.

#### Scenario: Env vars are migrated
- **WHEN** a developer reads the env contract and docs
- **THEN** `CATALOG_REBUILD_WEBHOOK_URL` and `CATALOG_REBUILD_WEBHOOK_TOKEN` are present
- **AND** `CATEGORIES_WEBHOOK_URL` is absent from code and docs

