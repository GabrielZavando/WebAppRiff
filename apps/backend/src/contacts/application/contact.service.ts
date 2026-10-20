import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  IEmailNotifier,
  I_EMAIL_NOTIFIER,
} from '../../email/domain/iemail-notifier';
import {
  IContactRepository,
  I_CONTACT_REPOSITORY,
} from '../domain/icontact.repository';
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
 * Application service for the public contact endpoint. It validates the
 * honeypot, persists the lead in Firestore and then sends the notification
 * email. Delivery is best-effort: a failed email is logged but never loses the
 * persisted lead nor fails the request.
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @Inject(I_CONTACT_REPOSITORY)
    private readonly repository: IContactRepository,
    @Inject(I_EMAIL_NOTIFIER)
    private readonly notifier: IEmailNotifier,
  ) {}

  async submit(input: ContactSubmitInput): Promise<ContactSubmission> {
    if (isHoneypotFilled(input.website)) {
      // Silent simulated success: never persist/notify a bot, never confirm the trap.
      return this.toSubmission(input);
    }

    const contacto = await this.repository.create({
      nombre: input.nombre,
      empresa: input.empresa,
      email: input.email,
      telefono: input.telefono,
      areasDeInteres: input.areasDeInteres,
      mensaje: input.mensaje,
    });

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
    try {
      await this.notifier.sendEmail(message);
    } catch (error) {
      this.logger.error(
        `Failed to send contact notification email (contact ${contacto.id}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

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