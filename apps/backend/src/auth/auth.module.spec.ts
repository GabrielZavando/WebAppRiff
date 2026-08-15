import { Global, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthModule } from './auth.module';
import { FIREBASE_AUTH } from '../infrastructure/firebase/firebase.tokens';

@Global()
@Module({
  providers: [{ provide: FIREBASE_AUTH, useValue: { verifyIdToken: jest.fn() } }],
  exports: [FIREBASE_AUTH],
})
class GlobalFirebaseAuthModule {}

describe('AuthModule', () => {
  it('compiles and exposes the guards as resolvable providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GlobalFirebaseAuthModule, AuthModule],
    }).compile();

    expect(moduleRef.get(FirebaseAuthGuard)).toBeInstanceOf(FirebaseAuthGuard);
    expect(moduleRef.get(RolesGuard)).toBeInstanceOf(RolesGuard);

    await moduleRef.close();
  });
});
