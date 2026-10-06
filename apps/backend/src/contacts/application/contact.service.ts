import { Inject, Injectable } from '@nestjs/common';
import {
  IEmailNotifier,
  I_EMAIL_NOTIFIER,
} from '../../email/domain/iemail-notifier';
import { buildLeadEmailMessage } from '../../email/application/lead-email-message';
import { isHoneypotFilled } from '../../common/utils/honeypot';

/** Input of a contact submission (mirrors `ContactCreateDto`). */
export interface ContactSubmitInput {
  readonly nombre: string;
  readonly empresa: string;
  readonly email: string;
  readonly telefono: string;
  readonly areasDeInteres?: readonly string[];
  readonly mensaje: string;
  /** Anti-spam honeypot; empty/absent for real users. */
  readonly website?: string;
}

/** Success receipt returned by `POST /api/v1/contacts` (no persistence). */
export interface ContactSubmission {
  readonly nombre: string;
  readonly empresa: string;
  readonly email: string;
  readonly telefono: string;
  readonly areasDeInteres: readonly string[];
  readonly mensaje: string;
}

/**
 * Application service for the public contact endpoint. It is intentionally
 * persistence-free (see design.md Non-Goals: contact persistence is deferred to
 * a post-MVP change): it validates the honeypot, sends the notification email
 * with every field and returns a receipt.
 */
@Injectable()
export class ContactService {
  constructor(
    @Inject(I_EMAIL_NOTIFIER)
    private readonly notifier: IEmailNotifier,
  ) {}

  async submit(input: ContactSubmitInput): Promise<ContactSubmission> {
    if (isHoneypotFilled(input.website)) {
      // Silent simulated success: never notify a bot, never confirm the trap.
      return this.toSubmission(input);
    }

    const message = buildLeadEmailMessage(
      'Nuevo mensaje desde el formulario de contacto',
      [
        { label: 'Nombre', value: input.nombre },
        { label: 'Empresa', value: input.empresa },
        { label: 'Email', value: input.email },
        { label: 'Teléfono', value: input.telefono },
        {
          label: 'Áreas de interés',
          value: (input.areasDeInteres ?? []).join(', '),
        },
        { label: 'Mensaje', value: input.mensaje },
      ],
    );
    await this.notifier.sendEmail(message);

    return this.toSubmission(input);
  }

  private toSubmission(input: ContactSubmitInput): ContactSubmission {
    return {
      nombre: input.nombre,
      empresa: input.empresa,
      email: input.email,
      telefono: input.telefono,
      areasDeInteres: input.areasDeInteres ?? [],
      mensaje: input.mensaje,
    };
  }
}