## ADDED Requirements

### Requirement: Backend SHALL notify a configured webhook when a category is created, updated, or deleted
The backend-categorias SHALL emit a category-change notification after a successful `create`, `update`, or `remove` of a category in `CategoriaService`. The notification SHALL be dispatched through an `ICategoryChangeNotifier` port (injected abstraction), implemented by a `WebhookCategoryChangeNotifier` that performs an HTTP `POST` to the URL in the `CATEGORIES_WEBHOOK_URL` environment variable. When `CATEGORIES_WEBHOOK_URL` is unset the notifier SHALL be a no-op. The dispatch SHALL be fire-and-forget (it MUST NOT block the API response and MUST NOT cause the mutation to fail); the notifier SHALL catch and log any transport error without re-throwing. The notification payload SHALL be a JSON object `{ id: string, action: "created" | "updated" | "deleted", occurredAt: string (ISO-8601) }`.

#### Scenario: Webhook fires on create
- **WHEN** an authenticated `admin` creates a category and `CATEGORIES_WEBHOOK_URL` is configured
- **THEN** the API responds 201
- **AND** a `POST` is sent to `CATEGORIES_WEBHOOK_URL` with a JSON body containing `action: "created"` and the new category `id`

#### Scenario: Webhook fires on update
- **WHEN** an authenticated role mutates a category via `PUT`/`PATCH` and `CATEGORIES_WEBHOOK_URL` is configured
- **THEN** the API responds 200
- **AND** a `POST` is sent with `action: "updated"`

#### Scenario: Webhook fires on delete
- **WHEN** an authenticated `admin` deletes a deletable category and `CATEGORIES_WEBHOOK_URL` is configured
- **THEN** the API responds 204
- **AND** a `POST` is sent with `action: "deleted"`

#### Scenario: No-op when webhook URL is unset
- **WHEN** a category is mutated and `CATEGORIES_WEBHOOK_URL` is empty/unset
- **THEN** no outbound HTTP request is made
- **AND** the mutation completes normally

#### Scenario: Webhook failure does not break the mutation
- **WHEN** the `POST` to `CATEGORIES_WEBHOOK_URL` fails (network error / non-2xx)
- **THEN** the already-confirmed mutation response is unaffected (201/200/204)
- **AND** the error is logged as a warning without propagating to the client
