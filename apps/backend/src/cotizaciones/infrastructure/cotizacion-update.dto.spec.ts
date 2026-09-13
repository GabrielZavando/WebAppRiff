import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CotizacionUpdateDto } from './cotizacion-update.dto';
import { buildValidationOptions } from '../../common/config/validation.config';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(CotizacionUpdateDto, payload);
  const errors = await validate(dto, buildValidationOptions());
  return errors.map((e) => e.property);
}

describe('CotizacionUpdateDto', () => {
  it('passes with estado "pendiente"', async () => {
    const errors = await validateDto({ estado: 'pendiente' });
    expect(errors).toHaveLength(0);
  });

  it('passes with estado "atendida"', async () => {
    const errors = await validateDto({ estado: 'atendida' });
    expect(errors).toHaveLength(0);
  });

  it('rejects when estado is missing', async () => {
    const errors = await validateDto({});
    expect(errors).toContain('estado');
  });

  it('rejects when estado is an invalid value', async () => {
    const errors = await validateDto({ estado: 'cancelada' });
    expect(errors).toContain('estado');
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    const errors = await validateDto({ estado: 'pendiente', hacker: true });
    expect(errors).toContain('hacker');
  });
});
