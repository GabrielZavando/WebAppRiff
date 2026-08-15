import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductoCreateDto } from './producto-create.dto';
import { buildValidationOptions } from '../../common/config/validation.config';

async function validateDto(payload: unknown): Promise<string[]> {
  const dto = plainToInstance(ProductoCreateDto, payload);
  const errors = await validate(dto, buildValidationOptions());
  return errors.map((e) => e.property);
}

describe('ProductoCreateDto', () => {
  const base = { sku: 'SKU-1', titulo: 'Válvula' };

  it('passes with only required fields', async () => {
    const errors = await validateDto(base);
    expect(errors).toHaveLength(0);
  });

  it('rejects when sku is missing', async () => {
    const errors = await validateDto({ titulo: 'X' });
    expect(errors).toContain('sku');
  });

  it('rejects when titulo is missing', async () => {
    const errors = await validateDto({ sku: 'S' });
    expect(errors).toContain('titulo');
  });

  it('validates nested galeria items (missing alt/orden)', async () => {
    const errors = await validateDto({ ...base, galeria: [{ url: 'u', storagePath: 'p' }] });
    expect(errors).toContain('galeria');
  });

  it('validates nested fichaTecnica (missing nombreArchivo)', async () => {
    const errors = await validateDto({ ...base, fichaTecnica: { url: 'u', storagePath: 'p' } });
    expect(errors).toContain('fichaTecnica');
  });

  it('validates nested atributos (missing valor)', async () => {
    const errors = await validateDto({ ...base, atributos: [{ nombre: 'a' }] });
    expect(errors).toContain('atributos');
  });

  it('allows null subcategoriaId', async () => {
    const errors = await validateDto({ ...base, subcategoriaId: null });
    expect(errors).toHaveLength(0);
  });

  it('rejects unknown fields (forbidNonWhitelisted)', async () => {
    const errors = await validateDto({ ...base, hacker: true });
    expect(errors).toContain('hacker');
  });
});
