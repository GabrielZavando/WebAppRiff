import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../../infrastructure/firebase/firebase.tokens';
import { ContactInput, Contacto } from '../domain/contacto.entity';
import { IContactRepository } from '../domain/icontact.repository';

const COLLECTION = 'contactos';

@Injectable()
export class ContactRepository implements IContactRepository {
  constructor(@Inject(FIRESTORE) private readonly firestore: Firestore) {}

  async create(input: ContactInput): Promise<Contacto> {
    const id = this.firestore.collection(COLLECTION).doc().id;
    const doc: Omit<Contacto, 'id'> = {
      nombre: input.nombre,
      empresa: input.empresa,
      email: input.email,
      telefono: input.telefono,
      areasDeInteres: [...(input.areasDeInteres ?? [])],
      mensaje: input.mensaje,
      creadoEn: new Date(),
    };
    await this.firestore.collection(COLLECTION).doc(id).set(doc);
    return { id, ...doc };
  }
}
