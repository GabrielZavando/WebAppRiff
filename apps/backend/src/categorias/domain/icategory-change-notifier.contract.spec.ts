import {
  CategoryChangeEvent,
  CategoryChangeAction,
  ICategoryChangeNotifier,
  I_CATEGORY_CHANGE_NOTIFIER,
} from './icategory-change-notifier';

/**
 * Contract test: locks the shape of the `ICategoryChangeNotifier` port so any
 * future Strategy implementation (webhook, queue, no-op) is forced to satisfy
 * the same interface and event type.
 */
class InMemoryNotifier implements ICategoryChangeNotifier {
  public events: CategoryChangeEvent[] = [];

  notifyChange(event: CategoryChangeEvent): void {
    this.events.push(event);
  }
}

describe('ICategoryChangeNotifier contract', () => {
  it('exposes a stable DI token', () => {
    expect(I_CATEGORY_CHANGE_NOTIFIER).toBe('I_CATEGORY_CHANGE_NOTIFIER');
  });

  it('allows an implementation to accept a valid event', () => {
    const notifier = new InMemoryNotifier();
    const event: CategoryChangeEvent = {
      id: 'c1',
      action: 'created',
      occurredAt: new Date().toISOString(),
    };
    notifier.notifyChange(event);
    expect(notifier.events).toHaveLength(1);
    expect(notifier.events[0]).toEqual(event);
  });

  it('accepts all action variants', () => {
    const notifier = new InMemoryNotifier();
    const actions: CategoryChangeAction[] = ['created', 'updated', 'deleted'];
    actions.forEach((action) => {
      notifier.notifyChange({ id: 'c1', action, occurredAt: new Date().toISOString() });
    });
    expect(notifier.events).toHaveLength(3);
  });
});
