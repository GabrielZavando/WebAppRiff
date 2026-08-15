import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductoUpdateDto } from './producto-update.dto';
import { buildValidationOptions } from '../../common/config/validation.config';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(ProductoUpdateDto, payload);
  const errors = await validate(dto, buildValidationOptions());
  return errors.map((e) => e.property);
}

describe('ProductoUpdateDto', () => {
  it('passes with an empty payload (all optional)', async () => {
    const errors = await validateDto({});
    expect(errors).toHaveLength(0);
  });

  it('passes with a single field (partial update)', async () => {
    const errors = await validateDto({ publicado: false });
    expect(errors).toHaveLength(0);
  });

  it('rejects empty sku when provided', async () => {
    const errors = await validateDto({ sku: '' });
    expect(errors).toContain('sku');
  });

  it('validates nested galeria items', async () => {
    const errors = await validateDto({ galeria: [{ url: 'u' }] });
    expect(errors).toContain('galeria');
  });

  it('validates nested fichaTecnica', async () => {
    const errors = await validateDto({ fichaTecnica: { url: 'u' } });
    expect(errors).toContain('fichaTecnica');
  });

  it('allows null subcategoriaId', async () => {
    const errors = await validateDto({ subcategoriaId: null });
    expect(errors).toHaveLength(0);
  });

  it('rejects unknown fields', async () => {
    const errors = await validateDto({ hacker: true });
    expect(errors).toContain('hacker');
  });
});
