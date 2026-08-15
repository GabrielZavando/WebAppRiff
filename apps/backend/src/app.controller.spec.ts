import { AppController } from './app.controller';
import { AppService, HealthResponse } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: { getHealth: jest.Mock };

  beforeEach(() => {
    service = { getHealth: jest.fn() };
    controller = new AppController(service as unknown as AppService);
  });

  describe('getHealth', () => {
    it('delegates to AppService.getHealth and returns the enriched response', async () => {
      const health: HealthResponse = {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: 12.34,
        firebase: 'up',
      };
      service.getHealth.mockResolvedValue(health);

      const result = await controller.getHealth();

      expect(service.getHealth).toHaveBeenCalledTimes(1);
      expect(result).toEqual(health);
    });
  });
});
