import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { buildServiceAccountFromEnv } from './firebase.config';
import { FIREBASE_APP } from './firebase.tokens';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): App => {
        const serviceAccount = buildServiceAccountFromEnv({
          projectId: config.get<string>('FIREBASE_PROJECT_ID'),
          clientEmail: config.get<string>('FIREBASE_CLIENT_EMAIL'),
          privateKey: config.get<string>('FIREBASE_PRIVATE_KEY'),
        });

        // firebase-admin es singleton por proceso: reutiliza la app existente
        // (p. ej., hot-reload o tests) en lugar de lanzar en un segundo init.
        if (getApps().length === 0) {
          return initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.projectId,
          });
        }

        return getApp();
      },
    },
  ],
  exports: [FIREBASE_APP],
})
export class FirebaseModule {}
