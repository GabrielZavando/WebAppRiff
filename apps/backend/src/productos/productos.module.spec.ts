import { Test } from '@nestjs/testing';
import { ProductosModule } from './productos.module';
import { ProductoController } from './infrastructure/producto.controller';
import { ProductoWriteService } from './application/producto-write.service';
import { CategoriaService } from '../categorias/application/categoria.service';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE } from '../infrastructure/firebase/firebase.tokens';

describe('ProductosModule', () => {
  it('compiles and wires the controller with read/write services and cross-module integrity ports', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductosModule, FirestoreModule],
    })
      .overrideProvider(FIREBASE_APP)
      .useValue({} as never)
      .overrideProvider(FIREBASE_AUTH)
      .useValue({ verifyIdToken: jest.fn(), setCustomUserClaims: jest.fn() } as never)
      .overrideProvider(FIRESTORE)
      .useValue({} as never)
      .overrideProvider(CategoriaService)
      .useValue({ ensureDefault: jest.fn().mockResolvedValue(undefined) })
      .compile();

    expect(moduleRef.get(ProductoController)).toBeInstanceOf(ProductoController);
    expect(moduleRef.get(ProductoWriteService)).toBeInstanceOf(ProductoWriteService);
  });
});
