import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ContactCreateDto } from './contact-create.dto';
import { buildValidationOptions } from '../../common/config/validation.config';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(ContactCreateDto, payload);
  const errors = await validate(dto, buildValidationOptions());
  return errors.map((e) => e.property);
}

describe('ContactCreateDto', () => {
  const base = {
    nombre: 'Juan',
    empresa: 'Empresa SA',
    email: 'juan@example.com',
    telefono: '+56912345678',
    mensaje: 'Necesito soporte técnico',
  };

  it('passes with only required fields', async () => {
    const errors = await validateDto(base);
    expect(errors).toHaveLength(0);
  });

  it('passes with areasDeInteres as an array of strings', async () => {
    const errors = await validateDto({
      ...base,
      areasDeInteres: ['medicion-fluidos', 'tratamiento-agua'],
    });
    expect(errors).toHaveLength(0);
  });

  it('passes without areasDeInteres (optional)', async () => {
    const errors = await validateDto(base);
    expect(errors).not.toContain('areasDeInteres');
  });

  it('passes with an empty or absent honeypot website (backward compatible)', async () => {
    const absent = await validateDto(base);
    expect(absent).not.toContain('website');
    const empty = await validateDto({ ...base, website: '' });
    expect(empty).not.toContain('website');
  });

  it('rejects when nombre is missing', async () => {
    const errors = await validateDto({ email: 'j@e.com', empresa: 'E', telefono: '+56', mensaje: 'm' });
    expect(errors).toContain('nombre');
  });

  it('rejects when empresa is missing', async () => {
    const errors = await validateDto({ ...base, empresa: undefined });
    expect(errors).toContain('empresa');
  });

  it('rejects when email is invalid', async () => {
    const errors = await validateDto({ ...base, email: 'not-an-email' });
    expect(errors).toContain('email');
  });

  it('rejects when telefono is missing', async () => {
    const errors = await validateDto({ ...base, telefono: undefined });
    expect(errors).toContain('telefono');
  });

  it('rejects when mensaje is missing', async () => {
    const errors = await validateDto({ ...base, mensaje: undefined });
    expect(errors).toContain('mensaje');
  });

  it('rejects non-string entries inside areasDeInteres', async () => {
    const errors = await validateDto({ ...base, areasDeInteres: [42] });
    expect(errors).toContain('areasDeInteres');
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    const errors = await validateDto({ ...base, hacker: true });
    expect(errors).toContain('hacker');
  });
});