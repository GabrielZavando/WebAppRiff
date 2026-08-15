import { Test } from '@nestjs/testing';
import { UsuariosModule } from './usuarios.module';
import { UsuarioController } from './infrastructure/usuario.controller';
import { UsuarioService } from './application/usuario.service';
import { FIREBASE_APP, FIREBASE_AUTH, FIRESTORE } from '../infrastructure/firebase/firebase.tokens';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';

describe('UsuariosModule', () => {
  it('compiles and exposes the usuario controller and service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsuariosModule, FirestoreModule],
    })
      .overrideProvider(FIREBASE_APP)
      .useValue({} as never)
      .overrideProvider(FIREBASE_AUTH)
      .useValue({ verifyIdToken: jest.fn(), setCustomUserClaims: jest.fn() } as never)
      .overrideProvider(FIRESTORE)
      .useValue({} as never)
      .compile();

    expect(moduleRef.get(UsuarioController)).toBeDefined();
    expect(moduleRef.get(UsuarioService)).toBeDefined();
  });
});
