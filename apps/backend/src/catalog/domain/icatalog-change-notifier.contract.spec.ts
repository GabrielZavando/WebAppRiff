import {
  CatalogChangeEvent,
  CatalogChangeAction,
  CatalogEntityType,
  ICatalogChangeNotifier,
  I_CATALOG_CHANGE_NOTIFIER,
} from './icatalog-change-notifier';

/**
 * Contract test: locks the shape of the `ICatalogChangeNotifier` port so any
 * future Strategy implementation (webhook, queue, no-op) is forced to satisfy
 * the same interface and event type (generalized to the whole catalog).
 */
class InMemoryNotifier implements ICatalogChangeNotifier {
  public events: CatalogChangeEvent[] = [];

  notifyChange(event: CatalogChangeEvent): void {
    this.events.push(event);
  }
}

describe('ICatalogChangeNotifier contract', () => {
  it('exposes a stable DI token', () => {
    expect(I_CATALOG_CHANGE_NOTIFIER).toBe('I_CATALOG_CHANGE_NOTIFIER');
  });

  it('allows an implementation to accept a valid event', () => {
    const notifier = new InMemoryNotifier();
    const event: CatalogChangeEvent = {
      entityType: 'category',
      id: 'c1',
      action: 'created',
      occurredAt: new Date().toISOString(),
    };
    notifier.notifyChange(event);
    expect(notifier.events).toHaveLength(1);
    expect(notifier.events[0]).toEqual(event);
  });

  it('accepts every entity type', () => {
    const notifier = new InMemoryNotifier();
    const entityTypes: CatalogEntityType[] = ['category', 'subcategory', 'product'];
    entityTypes.forEach((entityType) => {
      notifier.notifyChange({
        entityType,
        id: 'e1',
        action: 'updated',
        occurredAt: new Date().toISOString(),
      });
    });
    expect(notifier.events).toHaveLength(3);
  });

  it('accepts all action variants', () => {
    const notifier = new InMemoryNotifier();
    const actions: CatalogChangeAction[] = [
      'created',
      'updated',
      'deleted',
      'published',
      'unpublished',
    ];
    actions.forEach((action) => {
      notifier.notifyChange({
        entityType: 'product',
        id: 'p1',
        action,
        occurredAt: new Date().toISOString(),
      });
    });
    expect(notifier.events).toHaveLength(5);
  });
});