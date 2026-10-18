import { describe, expect, it } from 'vitest';

import { ApiError } from '../../shared/api/api-client.service';
import { deleteErrorMessage, fieldConflictMessage, genericErrorMessage, saveErrorMessage } from './api-error-mapping';

function conflict(message: string): ApiError {
  return new ApiError(message, 409, 'CONFLICT');
}

/**
 * Backend → UI error mapping (task 4.4, design D9). The backend messages are
 * stable (verified against the controllers); the mapping targets a form field
 * when the conflict is per-field, or produces a Spanish banner message for
 * delete blockers.
 */
describe('api-error-mapping (design D9)', () => {
  describe('fieldConflictMessage', () => {
    it('maps "SKU already in use" to the sku field', () => {
      expect(fieldConflictMessage(conflict('SKU already in use'))).toEqual({
        field: 'sku',
        message: 'El SKU ya está en uso.',
      });
    });

    it('maps "Slug already in use" to the slug field', () => {
      expect(fieldConflictMessage(conflict('Slug already in use'))).toEqual({
        field: 'slug',
        message: 'El slug ya está en uso.',
      });
    });

    it('maps the per-category slug conflict to the slug field with its own copy', () => {
      expect(fieldConflictMessage(conflict('Slug already in use within this category'))).toEqual({
        field: 'slug',
        message: 'El slug ya está en uso dentro de esta categoría.',
      });
    });

    it('returns null for non-conflict or unmapped errors', () => {
      expect(fieldConflictMessage(conflict('Something else'))).toBeNull();
      expect(fieldConflictMessage(new ApiError('Server error', 500, null))).toBeNull();
    });
  });

  describe('deleteErrorMessage', () => {
    it('maps the default-category blocker', () => {
      expect(deleteErrorMessage(conflict('Cannot delete the default category'))).toBe(
        'No se puede eliminar la categoría por defecto.',
      );
    });

    it('maps the category-with-products blocker', () => {
      expect(
        deleteErrorMessage(conflict('Cannot delete a category with associated products')),
      ).toBe('No se puede eliminar: la categoría tiene productos asociados.');
    });

    it('maps the subcategoria-with-products blocker', () => {
      expect(
        deleteErrorMessage(conflict('Cannot delete a subcategoria with associated products')),
      ).toBe('No se puede eliminar: la subcategoría tiene productos asociados.');
    });

    it('falls back to the backend message, then to a generic Spanish copy', () => {
      expect(deleteErrorMessage(new ApiError('Boom', 500, null))).toBe('Boom');
      expect(deleteErrorMessage(new ApiError('', 0, null))).toBe(genericErrorMessage);
    });
  });

  describe('saveErrorMessage', () => {
    it('maps a 404 to the friendly Spanish copy instead of the raw backend text', () => {
      expect(
        saveErrorMessage(new ApiError('Cannot PATCH /api/v1/products/abc', 404, null)),
      ).toBe('No se pudo encontrar el producto. Puede que haya sido eliminado.');
    });

    it('keeps the backend message for non-404 errors', () => {
      expect(saveErrorMessage(new ApiError('SKU already in use', 409, null))).toBe(
        'SKU already in use',
      );
    });

    it('falls back to a generic Spanish copy when the message is empty', () => {
      expect(saveErrorMessage(new ApiError('', 500, null))).toBe(genericErrorMessage);
    });
  });
});
