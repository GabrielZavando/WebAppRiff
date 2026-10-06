import { Test } from '@nestjs/testing';
import { ContactsModule } from './contacts.module';
import { ContactController } from './infrastructure/contact.controller';
import { ContactService } from './application/contact.service';
import { I_EMAIL_NOTIFIER } from '../email/domain/iemail-notifier';

describe('ContactsModule', () => {
  it('compiles and wires the controller and service with a fake email notifier', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ContactsModule],
    })
      .overrideProvider(I_EMAIL_NOTIFIER)
      .useValue({ sendEmail: jest.fn().mockResolvedValue(undefined) })
      .compile();

    expect(moduleRef.get(ContactController)).toBeInstanceOf(ContactController);
    expect(moduleRef.get(ContactService)).toBeInstanceOf(ContactService);
  });
});