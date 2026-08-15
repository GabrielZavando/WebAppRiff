import { Global, Module } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_APP, FIRESTORE } from './firebase.tokens';

@Global()
@Module({
  providers: [
    {
      provide: FIRESTORE,
      inject: [FIREBASE_APP],
      useFactory: (app: App): Firestore => getFirestore(app),
    },
  ],
  exports: [FIRESTORE],
})
export class FirestoreModule {}
