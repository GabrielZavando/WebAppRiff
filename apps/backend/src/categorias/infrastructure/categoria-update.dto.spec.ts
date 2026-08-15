import { validate } from 'class-validator';
import { CategoriaUpdateDto } from './categoria-update.dto';

describe('CategoriaUpdateDto', () => {
  it('is valid with an empty body (all fields optional)', async () => {
    const dto = Object.assign(new CategoriaUpdateDto(), {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid with a subset of fields', async () => {
    const dto = Object.assign(new CategoriaUpdateDto(), { nombre: 'Nuevo' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when nombre is an empty string', async () => {
    const dto = Object.assign(new CategoriaUpdateDto(), { nombre: '' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nombre')).toBe(true);
  });

  it('is invalid when orden is negative', async () => {
    const dto = Object.assign(new CategoriaUpdateDto(), { orden: -1 });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'orden')).toBe(true);
  });

  it('is invalid when activa is not a boolean', async () => {
    const dto = Object.assign(new CategoriaUpdateDto(), {
      activa: 'true' as unknown as boolean,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activa')).toBe(true);
  });
});
