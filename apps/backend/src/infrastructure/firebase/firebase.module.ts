import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';
import { FIREBASE_APP, FIREBASE_AUTH } from './firebase.tokens';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_APP,
      inject: [ConfigService],
      useFactory: (config: ConfigService): App => {
        // Application Default Credentials (ADC): en Cloud Run la identidad se
        // resuelve desde la service account de runtime del servicio sin
        // credenciales explícitas. En local se obtiene vía
        // `gcloud auth application-default login` o GOOGLE_APPLICATION_CREDENTIALS.
        //
        // firebase-admin es singleton por proceso: reutiliza la app existente
        // (p. ej., hot-reload o tests) en lugar de lanzar en un segundo init.
        if (getApps().length === 0) {
          return initializeApp({
            credential: applicationDefault(),
            projectId: config.getOrThrow<string>('FIREBASE_PROJECT_ID'),
            storageBucket: config.getOrThrow<string>('FIREBASE_STORAGE_BUCKET'),
          });
        }

        return getApp();
      },
    },
    {
      provide: FIREBASE_AUTH,
      inject: [FIREBASE_APP],
      useFactory: (app: App): Auth => getAuth(app),
    },
  ],
  exports: [FIREBASE_APP, FIREBASE_AUTH],
})
export class FirebaseModule {}
