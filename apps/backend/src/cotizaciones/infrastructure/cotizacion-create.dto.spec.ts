import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CotizacionCreateDto } from './cotizacion-create.dto';
import { buildValidationOptions } from '../../common/config/validation.config';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(CotizacionCreateDto, payload);
  const errors = await validate(dto, buildValidationOptions());
  return errors.map((e) => e.property);
}

describe('CotizacionCreateDto', () => {
  const base = {
    nombre: 'Juan',
    email: 'juan@example.com',
    nombre_empresa: 'Riff SpA',
    mensaje: 'Solicito cotización',
  };

  it('passes with only required fields', async () => {
    const errors = await validateDto(base);
    expect(errors).toHaveLength(0);
  });

  it('passes with all fields including optional telefono and rut', async () => {
    const errors = await validateDto({
      ...base,
      telefono: '+56912345678',
      rut: '12345678-9',
    });
    expect(errors).toHaveLength(0);
  });

  it('passes without rut (optional)', async () => {
    const errors = await validateDto({ ...base });
    expect(errors).not.toContain('rut');
  });

  it('rejects when nombre is missing', async () => {
    const errors = await validateDto({ email: 'juan@example.com', nombre_empresa: 'Riff', mensaje: 'msg' });
    expect(errors).toContain('nombre');
  });

  it('rejects when email is missing', async () => {
    const errors = await validateDto({ nombre: 'Juan', nombre_empresa: 'Riff', mensaje: 'msg' });
    expect(errors).toContain('email');
  });

  it('rejects when email is invalid', async () => {
    const errors = await validateDto({ ...base, email: 'not-an-email' });
    expect(errors).toContain('email');
  });

  it('rejects when nombre_empresa is missing', async () => {
    const errors = await validateDto({ nombre: 'Juan', email: 'juan@example.com', mensaje: 'msg' });
    expect(errors).toContain('nombre_empresa');
  });

  it('rejects when mensaje is missing', async () => {
    const errors = await validateDto({ nombre: 'Juan', email: 'juan@example.com', nombre_empresa: 'Riff' });
    expect(errors).toContain('mensaje');
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    const errors = await validateDto({ ...base, hacker: true });
    expect(errors).toContain('hacker');
  });
});
