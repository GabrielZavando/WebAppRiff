import { Test } from '@nestjs/testing';
import { NormalizeDescriptionsUseCase } from './normalize-descriptions.use-case';
import {
  I_PRODUCT_QUERY_REPOSITORY,
  I_PRODUCT_REPOSITORY,
} from '@/productos/domain/iproducto.repository';
import { I_HTML_SANITIZER } from '@/productos/domain/ihtml-sanitizer';

/**
 * Lightweight in-test simulation of the real sanitizer (the real package is
 * ESM-only and covered by its own Vitest suite). It decodes double-escaped
 * entities and strips tags, which is enough to assert the migration's
 * orchestration: change detection, dry-run gating and write-back.
 */
const sanitizer = {
  sanitizeRichHtml: jest.fn(
    (dirty: string) =>
      dirty
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .trim(),
  ),
  stripHtmlToText: jest.fn(
    (dirty: string) =>
      dirty.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(),
  ),
};

const query = { findAll: jest.fn() };
const repository = { update: jest.fn() };

describe('NormalizeDescriptionsUseCase', () => {
  let useCase: NormalizeDescriptionsUseCase;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NormalizeDescriptionsUseCase,
        { provide: I_PRODUCT_QUERY_REPOSITORY, useValue: query },
        { provide: I_PRODUCT_REPOSITORY, useValue: repository },
        { provide: I_HTML_SANITIZER, useValue: sanitizer },
      ],
    }).compile();
    useCase = moduleRef.get(NormalizeDescriptionsUseCase);
  });

  const productos = [
    // descripcionLarga double-escaped -> changes; descripcionBreve already plain.
    { id: 'p1', descripcionLarga: 'Texto &lt;strong&gt;bold&lt;/strong&gt;', descripcionBreve: 'Corto' },
    // descripcionBreve has stray tags -> changes; descripcionLarga already safe.
    { id: 'p2', descripcionLarga: 'Ya <strong>ok</strong>', descripcionBreve: '<p>Hola</p>' },
    // no changes at all.
    { id: 'p3', descripcionLarga: 'Ya <strong>ok</strong>', descripcionBreve: 'Igual' },
  ];

  it('writes back only the changed documents and reports counts', async () => {
    query.findAll.mockResolvedValue(productos);
    repository.update.mockResolvedValue({});

    const result = await useCase.execute(false);

    expect(result).toEqual({ escaneados: 3, modificados: 2, escritos: 2 });
    expect(repository.update).toHaveBeenCalledTimes(2);
    expect(repository.update).toHaveBeenCalledWith('p1', {
      descripcionLarga: 'Texto <strong>bold</strong>',
      descripcionBreve: 'Corto',
    });
    expect(repository.update).toHaveBeenCalledWith('p2', {
      descripcionLarga: 'Ya <strong>ok</strong>',
      descripcionBreve: 'Hola',
    });
  });

  it('does not write under --dry-run but still reports changes', async () => {
    query.findAll.mockResolvedValue(productos);

    const result = await useCase.execute(true);

    expect(result).toEqual({ escaneados: 3, modificados: 2, escritos: 0 });
    expect(repository.update).not.toHaveBeenCalled();
  });
});
