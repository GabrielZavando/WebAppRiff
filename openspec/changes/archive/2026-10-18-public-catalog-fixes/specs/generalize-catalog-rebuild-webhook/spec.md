# Spec Delta

## MODIFIED Requirements

### Requirement: The webhook SHALL authenticate with Bearer and a timeout

The notifier SHALL read `CATALOG_REBUILD_WEBHOOK_URL` and
`CATALOG_REBUILD_WEBHOOK_TOKEN` and send `POST` with
`Authorization: Bearer <token>` and `content-type: application/json`, aborted after
a configurable timeout. It SHALL never throw and SHALL log errors as warnings
without leaking the token or URL. A missing URL or token SHALL be an observable
no-op that emits an explicit warning naming the missing variable, never a silent
no-op.

#### Scenario: Request is authenticated with the bearer token
- **WHEN** the notifier sends the event
- **THEN** the request includes `Authorization: Bearer <token>` and `content-type: application/json`
- **AND** the token never appears in logs or the request body

#### Scenario: Request times out without blocking
- **WHEN** the webhook does not respond within the timeout
- **THEN** the request is aborted and the timeout is logged as a warning without secrets

#### Scenario: Unset URL is a no-op
- **WHEN** `CATALOG_REBUILD_WEBHOOK_URL` or `CATALOG_REBUILD_WEBHOOK_TOKEN` is not set and a catalog mutation occurs
- **THEN** the notifier sends nothing and the mutation proceeds without error
- **AND** a warning is logged stating that the rebuild webhook is not configured, naming the missing variable(s) and including neither the token nor the URL value

#### Scenario: Webhook failure does not fail the mutation
- **WHEN** the webhook returns an error or is unreachable
- **THEN** the catalog mutation succeeds and the error is recorded as a warning
