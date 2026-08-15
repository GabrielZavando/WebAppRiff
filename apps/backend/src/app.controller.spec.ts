import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
    controller = new AppController(service);
  });

  describe('getHealth', () => {
    it('should return the health envelope { status: "ok" }', () => {
      expect(controller.getHealth()).toEqual({ status: 'ok' });
    });
  });
});
