import { describe, it, expect } from 'vitest';
import type {
  CategoryOption,
  SearchFormConfig,
  SearchFormProps,
} from '@/lib/types/search-form';

describe('search-form.ts types', () => {
  it('CategoryOption constrains id+label strings', () => {
    const category: CategoryOption = { id: '', label: 'Todas las categorías' };
    expect(category.id).toBe('');
    expect(category.label).toBe('Todas las categorías');
  });

  it('SearchFormConfig exposes five readonly strings', () => {
    const config: SearchFormConfig = {
      action: '/productos',
      submitLabel: 'BUSCAR',
      inputPlaceholder: '¿Qué solución está buscando?',
      inputName: 'q',
      selectName: 'categoriaId',
    };
    expect(Object.keys(config).sort()).toEqual(
      ['action', 'inputName', 'inputPlaceholder', 'selectName', 'submitLabel'],
    );
  });

  it('SearchFormProps accepts required categories + config without initials', () => {
    const props: SearchFormProps = {
      categories: [{ id: '', label: 'Todas las categorías' }],
      config: {
        action: '/productos',
        submitLabel: 'BUSCAR',
        inputPlaceholder: '¿Qué solución está buscando?',
        inputName: 'q',
        selectName: 'categoriaId',
      },
    };
    expect(props.categories).toHaveLength(1);
    expect(props.initialQuery).toBeUndefined();
    expect(props.initialCategoriaId).toBeUndefined();
  });

  it('SearchFormProps accepts optional initialQuery and initialCategoriaId', () => {
    const props: SearchFormProps = {
      categories: [
        { id: '', label: 'Todas las categorías' },
        { id: 'herramientas', label: 'Herramientas' },
      ],
      config: {
        action: '/productos',
        submitLabel: 'BUSCAR',
        inputPlaceholder: '¿Qué solución está buscando?',
        inputName: 'q',
        selectName: 'categoriaId',
      },
      initialQuery: 'taladro',
      initialCategoriaId: 'herramientas',
    };
    expect(props.initialQuery).toBe('taladro');
    expect(props.initialCategoriaId).toBe('herramientas');
  });
});
