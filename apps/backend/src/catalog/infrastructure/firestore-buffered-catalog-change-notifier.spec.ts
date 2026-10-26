import { Logger } from '@nestjs/common';
import { FirestoreBufferedCatalogChangeNotifier } from './firestore-buffered-catalog-change-notifier';
import {
  CatalogChangeEvent,
  ICatalogChangeNotifier,
} from '../domain/icatalog-change-notifier';
import {
  FlushClaim,
  FlushFailureResolution,
  FlushSuccessResolution,
  ICatalogRebuildStateStore,
  I_CATALOG_REBUILD_STATE_STORE,
} from '../domain/icatalog-rebuild-state-store';

const ORIGINAL_ENV = process.env;
const URL = 'https://hooks.example.com/catalog-rebuild';
const TOKEN = 'super-secret-token-123';

const SAMPLE_EVENT: CatalogChangeEvent = {
  entityType: 'category',
  id: 'c1',
  action: 'created',
  occurredAt: new Date('2026-01-15T12:00:00.000Z').toISOString(),
};

class InMemoryStateStore implements ICatalogRebuildStateStore {
  public recorded: CatalogChangeEvent[] = [];
  public nextError: Error | null = null;

  async recordChange(event: CatalogChangeEvent): Promise<void> {
    if (this.nextError) {
      const error = this.nextError;
      this.nextError = null;
      throw error;
    }
    this.recorded.push(event);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async claimForDispatch(): Promise<FlushClaim> {
    return { decision: 'no_pending' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveSuccess(): Promise<FlushSuccessResolution> {
    return 'cleared';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveFailure(): Promise<FlushFailureResolution | null> {
    return null;
  }
}

export const I_STATE_STORE_TEST = I_CATALOG_REBUILD_STATE_STORE;

function buildNotifier(store: ICatalogRebuildStateStore): ICatalogChangeNotifier {
  return new FirestoreBufferedCatalogChangeNotifier(store);
}

async function settle(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}

describe('FirestoreBufferedCatalogChangeNotifier', () => {
  let store: InMemoryStateStore;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.CATALOG_REBUILD_WEBHOOK_URL = URL;
    process.env.CATALOG_REBUILD_WEBHOOK_TOKEN = TOKEN;
    store = new InMemoryStateStore();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    warnSpy.mockRestore();
  });

  describe('buffers changes through the state store (4.1)', () => {
    it('delegates the event to the state store', async () => {
      buildNotifier(store).notifyChange(SAMPLE_EVENT);
      await settle();

      expect(store.recorded).toHaveLength(1);
      expect(store.recorded[0]).toEqual(SAMPLE_EVENT);
    });

    it('does not block or fail the mutation when the store works', () => {
      expect(() => buildNotifier(store).notifyChange(SAMPLE_EVENT)).not.toThrow();
    });

    it('never throws when the state store rejects; logs a warning instead', async () => {
      store.nextError = new Error('firestore down');

      expect(() => buildNotifier(store).notifyChange(SAMPLE_EVENT)).not.toThrow();
      await settle();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('category');
      expect(message).not.toContain(TOKEN);
      expect(message).not.toContain(URL);
    });
  });

  describe('unset webhook is an observable no-op (4.2)', () => {
    it('writes no state and warns naming the URL when the URL is unset', async () => {
      delete process.env.CATALOG_REBUILD_WEBHOOK_URL;

      buildNotifier(store).notifyChange(SAMPLE_EVENT);
      await settle();

      expect(store.recorded).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('CATALOG_REBUILD_WEBHOOK_URL');
      expect(message).toContain('category');
      expect(message).not.toContain(TOKEN);
    });

    it('writes no state and warns naming the token when the token is unset', async () => {
      delete process.env.CATALOG_REBUILD_WEBHOOK_TOKEN;

      buildNotifier(store).notifyChange(SAMPLE_EVENT);
      await settle();

      expect(store.recorded).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = String(warnSpy.mock.calls[0][0]);
      expect(message).toContain('CATALOG_REBUILD_WEBHOOK_TOKEN');
      expect(message).not.toContain(URL);
    });
  });
});
