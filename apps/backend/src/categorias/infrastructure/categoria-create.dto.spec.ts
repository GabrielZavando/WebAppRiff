import { validate } from 'class-validator';
import { CategoriaCreateDto } from './categoria-create.dto';

describe('CategoriaCreateDto', () => {
  it('is valid with required nombre and slug', async () => {
    const dto = Object.assign(new CategoriaCreateDto(), {
      nombre: 'Válvulas',
      slug: 'valvulas',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid without slug', async () => {
    const dto = Object.assign(new CategoriaCreateDto(), { nombre: 'Válvulas' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });

  it('is invalid without nombre', async () => {
    const dto = Object.assign(new CategoriaCreateDto(), { slug: 'valvulas' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nombre')).toBe(true);
  });

  it('accepts optional orden and activa with correct types', async () => {
    const dto = Object.assign(new CategoriaCreateDto(), {
      nombre: 'Válvulas',
      slug: 'valvulas',
      orden: 3,
      activa: false,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when orden is not an integer', async () => {
    const dto = Object.assign(new CategoriaCreateDto(), {
      nombre: 'Válvulas',
      slug: 'valvulas',
      orden: 'no-number' as unknown as number,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'orden')).toBe(true);
  });

  it('is invalid when activa is not a boolean', async () => {
    const dto = Object.assign(new CategoriaCreateDto(), {
      nombre: 'Válvulas',
      slug: 'valvulas',
      activa: 'yes' as unknown as boolean,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activa')).toBe(true);
  });
});
