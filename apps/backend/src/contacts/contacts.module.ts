import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { ContactController } from './infrastructure/contact.controller';
import { ContactService } from './application/contact.service';

/**
 * Public contact endpoint module. The service depends only on the
 * `I_EMAIL_NOTIFIER` port provided by `EmailModule` (no persistence).
 */
@Module({
  imports: [EmailModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactsModule {}