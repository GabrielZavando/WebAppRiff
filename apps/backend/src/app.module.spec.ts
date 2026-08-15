import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';

describe('AppModule', () => {
  it('compiles and resolves the AppController from the DI graph', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const controller = moduleRef.get(AppController);
    expect(controller).toBeDefined();
    expect(controller.getHealth()).toEqual({ status: 'ok' });

    await moduleRef.close();
  });
});
