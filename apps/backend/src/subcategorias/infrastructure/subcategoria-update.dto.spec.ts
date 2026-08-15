import { validate } from 'class-validator';
import { SubcategoriaUpdateDto } from './subcategoria-update.dto';

describe('SubcategoriaUpdateDto', () => {
  it('is valid with an empty update (all optional)', async () => {
    const dto = new SubcategoriaUpdateDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid with a subset of fields', async () => {
    const dto = Object.assign(new SubcategoriaUpdateDto(), { nombre: 'Nuevo' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when nombre is an empty string', async () => {
    const dto = Object.assign(new SubcategoriaUpdateDto(), { nombre: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nombre')).toBe(true);
  });

  it('is invalid when slug is an empty string', async () => {
    const dto = Object.assign(new SubcategoriaUpdateDto(), { slug: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });

  it('is invalid when orden is not an integer', async () => {
    const dto = Object.assign(new SubcategoriaUpdateDto(), {
      orden: 'no-number' as unknown as number,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'orden')).toBe(true);
  });

  it('is invalid when activa is not a boolean', async () => {
    const dto = Object.assign(new SubcategoriaUpdateDto(), {
      activa: 'yes' as unknown as boolean,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activa')).toBe(true);
  });
});
