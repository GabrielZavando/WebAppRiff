import { Test } from '@nestjs/testing';
import { EmailModule } from './email.module';
import { I_EMAIL_NOTIFIER, IEmailNotifier } from './domain/iemail-notifier';
import { ResendEmailNotifier } from './infrastructure/resend-email-notifier';

describe('EmailModule', () => {
  it('binds the I_EMAIL_NOTIFIER token to the Resend adapter', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();

    const notifier = moduleRef.get<IEmailNotifier>(I_EMAIL_NOTIFIER);
    expect(notifier).toBeInstanceOf(ResendEmailNotifier);
  });
});