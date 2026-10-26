import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CatalogRebuildFlushController } from './catalog-rebuild-flush.controller';
import { GOOGLE_OAUTH2_CLIENT } from './scheduler-oidc.guard';
import {
  CatalogRebuildConfig,
  CATALOG_REBUILD_CONFIG,
} from '../application/catalog-rebuild.config';
import {
  ICatalogRebuildStateStore,
  I_CATALOG_REBUILD_STATE_STORE,
} from '../domain/icatalog-rebuild-state-store';
import {
  ICatalogRebuildWebhookClient,
  I_CATALOG_REBUILD_WEBHOOK_CLIENT,
} from '../domain/icatalog-rebuild-webhook-client';
import { CatalogRebuildFlushService } from '../application/catalog-rebuild-flush.service';

const CONFIG: CatalogRebuildConfig = {
  silenceSeconds: 60,
  maxWaitSeconds: 300,
  claimTtlSeconds: 60,
  expectedAudience: 'https://api.example.com',
  expectedSa: 'flusher@example.iam.gserviceaccount.com',
};

const VALID_TOKEN = 'valid-oidc-token';

class StubStore implements ICatalogRebuildStateStore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async recordChange(): Promise<void> {
    /* not used */
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async claimForDispatch() {
    return { decision: 'no_pending' } as const;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveSuccess() {
    return 'cleared' as const;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async resolveFailure() {
    return null;
  }
}

class StubClient implements ICatalogRebuildWebhookClient {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async dispatch() {
    return { ok: true } as const;
  }
}

@Module({
  controllers: [CatalogRebuildFlushController],
  providers: [
    CatalogRebuildFlushService,
    { provide: CATALOG_REBUILD_CONFIG, useValue: CONFIG },
    { provide: GOOGLE_OAUTH2_CLIENT, useValue: { verifyIdToken: jest.fn() } },
    { provide: I_CATALOG_REBUILD_STATE_STORE, useClass: StubStore },
    { provide: I_CATALOG_REBUILD_WEBHOOK_CLIENT, useClass: StubClient },
  ],
})
class FlushTestModule {}

describe('CatalogRebuildFlushController (6.3)', () => {
  let app: INestApplication;
  let verifyIdToken: jest.Mock;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [FlushTestModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    // Mirrors main.ts: the internal route lives OUTSIDE the /api/v1 prefix,
    // excluded with the same mechanism as 'health'.
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'internal/catalog-rebuild/flush'],
    });
    await app.init();
    verifyIdToken = app.get(GOOGLE_OAUTH2_CLIENT).verifyIdToken as jest.Mock;
    verifyIdToken.mockReset();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the route at /internal/catalog-rebuild/flush (outside the api/v1 prefix)', async () => {
    verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        aud: CONFIG.expectedAudience,
        email: CONFIG.expectedSa,
        email_verified: true,
      }),
    });

    const response = await request(app.getHttpServer())
      .post('/internal/catalog-rebuild/flush')
      .set('Authorization', `Bearer ${VALID_TOKEN}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'no-pending' });
    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: VALID_TOKEN,
      audience: CONFIG.expectedAudience,
    });
  });

  it('does NOT serve the route under the /api/v1 prefix', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/internal/catalog-rebuild/flush');

    expect(response.status).toBe(404);
  });

  it('rejects the route without the Scheduler identity (guard wired via @UseGuards)', async () => {
    const response = await request(app.getHttpServer()).post('/internal/catalog-rebuild/flush');

    expect(response.status).toBe(401);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });
});
