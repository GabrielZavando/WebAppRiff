import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  describe('getStatus', () => {
    it('should return "ok"', () => {
      expect(service.getStatus()).toBe('ok');
    });
  });
});
