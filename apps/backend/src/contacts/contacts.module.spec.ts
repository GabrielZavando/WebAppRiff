import { Test } from '@nestjs/testing';
import { ContactsModule } from './contacts.module';
import { ContactController } from './infrastructure/contact.controller';
import { ContactService } from './application/contact.service';
import { ContactRepository } from './infrastructure/contact.repository';
import {
  IContactRepository,
  I_CONTACT_REPOSITORY,
} from './domain/icontact.repository';
import { I_EMAIL_NOTIFIER } from '../email/domain/iemail-notifier';
import { FirestoreModule } from '../infrastructure/firebase/firestore.module';
import { FIRESTORE } from '../infrastructure/firebase/firebase.tokens';

describe('ContactsModule', () => {
  it('compiles and wires the controller, service and contact repository', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ContactsModule, FirestoreModule],
    })
      .overrideProvider(FIRESTORE)
      .useValue({})
      .overrideProvider(I_EMAIL_NOTIFIER)
      .useValue({ sendEmail: jest.fn().mockResolvedValue(undefined) })
      .compile();

    expect(moduleRef.get(ContactController)).toBeInstanceOf(ContactController);
    expect(moduleRef.get(ContactService)).toBeInstanceOf(ContactService);
    expect(moduleRef.get<IContactRepository>(I_CONTACT_REPOSITORY)).toBeInstanceOf(
      ContactRepository,
    );
  });
});
