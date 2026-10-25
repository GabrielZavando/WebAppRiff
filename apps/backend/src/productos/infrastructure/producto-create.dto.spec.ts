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

  it('accepts a short description of exactly 800 visible characters', async () => {
    const errors = await validateDto({ ...base, descripcionBreve: 'a'.repeat(800) });
    expect(errors).toHaveLength(0);
  });

  it('rejects a short description of 801 visible characters', async () => {
    const errors = await validateDto({ ...base, descripcionBreve: 'a'.repeat(801) });
    expect(errors).toContain('descripcionBreve');
  });

  it('accepts a long description with 3000 visible characters even when markup makes it longer', async () => {
    const errors = await validateDto({
      ...base,
      descripcionLarga: `<p><strong>${'a'.repeat(3000)}</strong></p>`,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a long description with 3001 visible characters', async () => {
    const errors = await validateDto({
      ...base,
      descripcionLarga: `<p>${'a'.repeat(3001)}</p>`,
    });
    expect(errors).toContain('descripcionLarga');
  });

  it('does not count script or style content toward the long description limit', async () => {
    const errors = await validateDto({
      ...base,
      descripcionLarga:
        `<p>${'a'.repeat(3000)}</p>` +
        `<script>${'b'.repeat(4000)}</script>` +
        `<style>${'c'.repeat(4000)}</style>`,
    });
    expect(errors).toHaveLength(0);
  });
});
