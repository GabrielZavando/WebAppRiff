/** Contact lead persisted in the `contactos` Firestore collection. */
export interface Contacto {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  areasDeInteres: string[];
  mensaje: string;
  creadoEn: Date;
}

/** Payload for creating a new contact (without id or timestamp). */
export type ContactInput = {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  areasDeInteres?: readonly string[];
  mensaje: string;
};
