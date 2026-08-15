import { AppService, HealthResponse } from './app.service';
import type { Firestore } from 'firebase-admin/firestore';

const mockFirestoreUp = {
  listCollections: jest.fn().mockResolvedValue([]),
} as unknown as Firestore;

const mockFirestoreDown = {
  listCollections: jest.fn().mockRejectedValue(new Error('firestore unreachable')),
} as unknown as Firestore;

const mockFirestoreSlow = {
  listCollections: jest.fn().mockReturnValue(new Promise<never>(() => undefined)),
} as unknown as Firestore;

describe('AppService', () => {
  describe('getHealth', () => {
    it('returns the enriched shape with firebase "up" when Firestore responds', async () => {
      const service = new AppService(mockFirestoreUp);
      const result = await service.getHealth();

      expect(result.status).toBe('ok');
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
      expect(typeof result.timestamp).toBe('string');
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(typeof result.uptime).toBe('number');
      expect(result.firebase).toBe('up');
    });

    it('returns firebase "down" but status "ok" when Firestore ping rejects', async () => {
      const service = new AppService(mockFirestoreDown);
      const result = await service.getHealth();

      expect(result.status).toBe('ok');
      expect(result.firebase).toBe('down');
    });

    it('returns firebase "down" when the Firestore ping exceeds the timeout', async () => {
      const previous = process.env.HEALTH_PING_TIMEOUT_MS;
      process.env.HEALTH_PING_TIMEOUT_MS = '50';
      const service = new AppService(mockFirestoreSlow);

      const result = await service.getHealth();

      expect(result.status).toBe('ok');
      expect(result.firebase).toBe('down');
      if (previous === undefined) {
        delete process.env.HEALTH_PING_TIMEOUT_MS;
      } else {
        process.env.HEALTH_PING_TIMEOUT_MS = previous;
      }
    });

    it('reads the version from process.env.npm_package_version when present', async () => {
      const previous = process.env.npm_package_version;
      process.env.npm_package_version = '9.9.9';
      const service = new AppService(mockFirestoreUp);

      const result = await service.getHealth();

      expect(result.version).toBe('9.9.9');
      if (previous === undefined) {
        delete process.env.npm_package_version;
      } else {
        process.env.npm_package_version = previous;
      }
    });
  });
});

export type { HealthResponse };
