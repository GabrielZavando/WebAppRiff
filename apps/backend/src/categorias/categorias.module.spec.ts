import { Test } from '@nestjs/testing';
import { CategoriasModule } from './categorias.module';
import { CategoriaController } from './infrastructure/categoria.controller';
import { CategoriaService } from './application/categoria.service';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIRESTORE,
} from '../infrastructure/firebase/firebase.tokens';

describe('CategoriasModule', () => {
  it('compiles, exposes the controller and seeds the default category on init', async () => {
    const fakeService = { ensureDefault: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      imports: [CategoriasModule, FirestoreModule],
    })
      .overrideProvider(FIREBASE_APP)
      .useValue({} as never)
      .overrideProvider(FIREBASE_AUTH)
      .useValue({ verifyIdToken: jest.fn(), setCustomUserClaims: jest.fn() } as never)
      .overrideProvider(FIRESTORE)
      .useValue({} as never)
      .overrideProvider(CategoriaService)
      .useValue(fakeService)
      .compile();

    expect(moduleRef.get(CategoriaController)).toBeInstanceOf(CategoriaController);

    const mod = moduleRef.get(CategoriasModule);
    await mod.onModuleInit();

    expect(fakeService.ensureDefault).toHaveBeenCalledTimes(1);
  });
});
