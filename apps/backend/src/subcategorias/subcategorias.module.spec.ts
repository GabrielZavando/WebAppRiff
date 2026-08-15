import { Test } from '@nestjs/testing';
import { SubcategoriasModule } from './subcategorias.module';
import { SubcategoriaController } from './infrastructure/subcategoria.controller';
import { SubcategoriaService } from './application/subcategoria.service';
import { CategoriaService } from '../categorias/application/categoria.service';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIRESTORE,
} from '../infrastructure/firebase/firebase.tokens';

describe('SubcategoriasModule', () => {
  it('compiles and exposes the controller with cross-module category repository', async () => {
    const fakeSubService = { findAll: jest.fn() };
    const fakeCatService = { ensureDefault: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      imports: [SubcategoriasModule, FirestoreModule],
    })
      .overrideProvider(FIREBASE_APP)
      .useValue({} as never)
      .overrideProvider(FIREBASE_AUTH)
      .useValue({ verifyIdToken: jest.fn(), setCustomUserClaims: jest.fn() } as never)
      .overrideProvider(FIRESTORE)
      .useValue({} as never)
      .overrideProvider(SubcategoriaService)
      .useValue(fakeSubService)
      .overrideProvider(CategoriaService)
      .useValue(fakeCatService)
      .compile();

    expect(moduleRef.get(SubcategoriaController)).toBeInstanceOf(SubcategoriaController);
  });
});
