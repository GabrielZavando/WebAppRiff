import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { FirestoreModule } from './infrastructure/firebase/firestore.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FirebaseModule, FirestoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
