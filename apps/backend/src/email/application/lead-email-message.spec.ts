import { buildLeadEmailMessage } from './lead-email-message';

const ORIGINAL_ENV = process.env;

describe('buildLeadEmailMessage', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('defaults the recipient to contacto@somosriff.cl when CONTACT_TO_EMAIL is unset', () => {
    delete process.env.CONTACT_TO_EMAIL;
    const message = buildLeadEmailMessage('Asunto', [
      { label: 'Nombre', value: 'Juan' },
    ]);
    expect(message.to).toEqual(['contacto@somosriff.cl']);
  });

  it('uses CONTACT_TO_EMAIL when defined', () => {
    process.env.CONTACT_TO_EMAIL = 'ventas@somosriff.cl';
    const message = buildLeadEmailMessage('Asunto', [
      { label: 'Nombre', value: 'Juan' },
    ]);
    expect(message.to).toEqual(['ventas@somosriff.cl']);
  });

  it('uses CONTACT_FROM_EMAIL as the sender, defaulting to the inbox', () => {
    delete process.env.CONTACT_FROM_EMAIL;
    expect(buildLeadEmailMessage('s', []).from).toBe('contacto@somosriff.cl');
    process.env.CONTACT_FROM_EMAIL = 'no-reply@somosriff.cl';
    expect(buildLeadEmailMessage('s', []).from).toBe('no-reply@somosriff.cl');
  });

  it('renders every field as a "Label: value" line in the text body', () => {
    const message = buildLeadEmailMessage('Nuevo contacto', [
      { label: 'Nombre', value: 'Juan Pérez' },
      { label: 'Email', value: 'juan@example.com' },
      { label: 'Áreas de interés', value: 'Medición de Fluidos' },
    ]);
    expect(message.subject).toBe('Nuevo contacto');
    expect(message.text).toBe(
      'Nombre: Juan Pérez\nEmail: juan@example.com\nÁreas de interés: Medición de Fluidos',
    );
  });
});