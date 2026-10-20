import { ContactInput, Contacto } from './contacto.entity';

/**
 * Port for contact data access (ISP, single method).
 * Implemented in infrastructure with the Firebase Admin SDK.
 */
export interface IContactRepository {
  create(input: ContactInput): Promise<Contacto>;
}

export const I_CONTACT_REPOSITORY = 'I_CONTACT_REPOSITORY';
