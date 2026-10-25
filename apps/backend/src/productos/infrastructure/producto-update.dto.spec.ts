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

  it('accepts a short description of exactly 800 visible characters', async () => {
    const errors = await validateDto({ descripcionBreve: 'a'.repeat(800) });
    expect(errors).toHaveLength(0);
  });

  it('rejects a short description of 801 visible characters', async () => {
    const errors = await validateDto({ descripcionBreve: 'a'.repeat(801) });
    expect(errors).toContain('descripcionBreve');
  });

  it('accepts a long description with 3000 visible characters even when markup makes it longer', async () => {
    const errors = await validateDto({
      descripcionLarga: `<p><strong>${'a'.repeat(3000)}</strong></p>`,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects a long description with 3001 visible characters', async () => {
    const errors = await validateDto({
      descripcionLarga: `<p>${'a'.repeat(3001)}</p>`,
    });
    expect(errors).toContain('descripcionLarga');
  });

  it('does not count script or style content toward the long description limit', async () => {
    const errors = await validateDto({
      descripcionLarga:
        `<p>${'a'.repeat(3000)}</p>` +
        `<script>${'b'.repeat(4000)}</script>` +
        `<style>${'c'.repeat(4000)}</style>`,
    });
    expect(errors).toHaveLength(0);
  });
});
