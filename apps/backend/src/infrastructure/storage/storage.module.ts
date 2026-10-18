import { Global, Module } from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { ConfigService } from '@nestjs/config';

import { FIREBASE_APP } from '../firebase/firebase.tokens';
import { FILE_STORAGE_PORT } from './file-storage.port';
import { buildLazyFileStoragePort } from './lazy-file-storage.port';

@Global()
@Module({
  providers: [
    {
      provide: FILE_STORAGE_PORT,
      inject: [FIREBASE_APP, ConfigService],
      useFactory: (app: App, config: ConfigService) =>
        buildLazyFileStoragePort(app, config.getOrThrow<string>('FIREBASE_STORAGE_BUCKET')),
    },
  ],
  exports: [FILE_STORAGE_PORT],
})
export class StorageModule {}
