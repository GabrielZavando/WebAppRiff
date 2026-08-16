/**
 * Port that notifies interested systems (e.g. the static site build pipeline)
 * when a category is created, updated, or deleted.
 *
 * Declared in `domain/` as an abstraction so the application service depends on
 * this interface (DIP) and any concrete transport (webhook, queue, no-op) is
 * injected from `infrastructure/` via the `I_CATEGORY_CHANGE_NOTIFIER` token.
 */

export type CategoryChangeAction = 'created' | 'updated' | 'deleted';

export interface CategoryChangeEvent {
  /** Identifier of the affected category. */
  readonly id: string;
  /** What happened to the category. */
  readonly action: CategoryChangeAction;
  /** ISO-8601 timestamp of when the change was emitted. */
  readonly occurredAt: string;
}

export interface ICategoryChangeNotifier {
  /**
   * Notify that a category changed. Implementations MUST NOT throw and SHOULD
   * be fire-and-forget (the caller must not await or depend on completion).
   */
  notifyChange(event: CategoryChangeEvent): void | Promise<void>;
}

export const I_CATEGORY_CHANGE_NOTIFIER = 'I_CATEGORY_CHANGE_NOTIFIER';
