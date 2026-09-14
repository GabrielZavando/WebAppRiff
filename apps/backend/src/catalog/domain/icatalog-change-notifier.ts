/**
 * Port that notifies interested systems (e.g. the static Astro site build
 * pipeline) whenever a public catalog entity changes: a category, a subcategory
 * or a product (created/updated/deleted/published/unpublished).
 *
 * Declared in `domain/` as an abstraction so application services depend on
 * this interface (DIP) and any concrete transport (webhook, queue, no-op) is
 * injected from `infrastructure/` via the `I_CATALOG_CHANGE_NOTIFIER` token.
 */
export type CatalogEntityType = 'category' | 'subcategory' | 'product';

export type CatalogChangeAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'unpublished';

export interface CatalogChangeEvent {
  /** Which catalog entity changed. */
  readonly entityType: CatalogEntityType;
  /** Identifier of the affected entity. */
  readonly id: string;
  /** What happened to the entity. */
  readonly action: CatalogChangeAction;
  /** ISO-8601 timestamp of when the change was emitted. */
  readonly occurredAt: string;
}

export interface ICatalogChangeNotifier {
  /**
   * Notify that a catalog entity changed. Implementations MUST NOT throw and
   * SHOULD be fire-and-forget (the caller must not await or depend on
   * completion).
   */
  notifyChange(event: CatalogChangeEvent): void | Promise<void>;
}

export const I_CATALOG_CHANGE_NOTIFIER = 'I_CATALOG_CHANGE_NOTIFIER';