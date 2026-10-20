import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { ContactController } from './infrastructure/contact.controller';
import { ContactService } from './application/contact.service';
import { ContactRepository } from './infrastructure/contact.repository';
import { I_CONTACT_REPOSITORY } from './domain/icontact.repository';

/**
 * Public contact endpoint module. The service depends on the
 * `I_CONTACT_REPOSITORY` port (Firestore) and the `I_EMAIL_NOTIFIER` port
 * provided by `EmailModule`.
 */
@Module({
  imports: [EmailModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    { provide: I_CONTACT_REPOSITORY, useClass: ContactRepository },
  ],
})
export class ContactsModule {}
