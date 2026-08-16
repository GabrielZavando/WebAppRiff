import { validate } from 'class-validator';
import { SubcategoriaCreateDto } from './subcategoria-create.dto';

describe('SubcategoriaCreateDto', () => {
  it('is valid with required categoriaId, nombre and slug', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      nombre: 'Válvulas',
      slug: 'valvulas',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid without slug (auto-generated from nombre)', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      nombre: 'Válvulas',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when slug is an empty string', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      nombre: 'Válvulas',
      slug: '',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });

  it('is invalid without nombre', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      slug: 'valvulas',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'nombre')).toBe(true);
  });

  it('is invalid without categoriaId', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      nombre: 'Válvulas',
      slug: 'valvulas',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'categoriaId')).toBe(true);
  });

  it('accepts optional orden and activa with correct types', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      nombre: 'Válvulas',
      slug: 'valvulas',
      orden: 3,
      activa: false,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when orden is not an integer', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      nombre: 'Válvulas',
      slug: 'valvulas',
      orden: 'no-number' as unknown as number,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'orden')).toBe(true);
  });

  it('is invalid when activa is not a boolean', async () => {
    const dto = Object.assign(new SubcategoriaCreateDto(), {
      categoriaId: 'cat-1',
      nombre: 'Válvulas',
      slug: 'valvulas',
      activa: 'yes' as unknown as boolean,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'activa')).toBe(true);
  });
});
