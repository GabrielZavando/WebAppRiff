import { ApiError } from '../../shared/api/api-client.service';

/**
 * Backend → UI error mapping (design D9). The backend messages are stable
 * (verified against the NestJS controllers in Fase 2); they are translated to
 * Spanish copy and, for per-field write conflicts, to the target form field.
 */

/** Field-level conflict result: which form field to flag and what to say. */
export interface FieldConflict {
  field: 'sku' | 'slug';
  message: string;
}

/** Shown when a delete/save failure has no specific mapping. */
export const genericErrorMessage = 'No se pudo completar la operación. Inténtalo nuevamente.';

/** Maps a 409 write conflict to its form field, or null when unmappable. */
export function fieldConflictMessage(error: ApiError): FieldConflict | null {
  const message = error.message;
  if (message === 'SKU already in use') {
    return { field: 'sku', message: 'El SKU ya está en uso.' };
  }
  if (message === 'Slug already in use within this category') {
    return { field: 'slug', message: 'El slug ya está en uso dentro de esta categoría.' };
  }
  if (message === 'Slug already in use') {
    return { field: 'slug', message: 'El slug ya está en uso.' };
  }
  return null;
}

/** Maps a delete failure to a Spanish banner message. */
export function deleteErrorMessage(error: ApiError): string {
  switch (error.message) {
    case 'Cannot delete the default category':
      return 'No se puede eliminar la categoría por defecto.';
    case 'Cannot delete a category with associated products':
      return 'No se puede eliminar: la categoría tiene productos asociados.';
    case 'Cannot delete a subcategoria with associated products':
      return 'No se puede eliminar: la subcategoría tiene productos asociados.';
    default:
      return error.message !== '' ? error.message : genericErrorMessage;
  }
}

/** Maps a load/list failure to a Spanish banner message. */
export function loadErrorMessage(error: ApiError): string {
  return error.message !== '' ? error.message : genericErrorMessage;
}

/** Maps a create/update (save) failure to a Spanish banner message. */
export function saveErrorMessage(error: ApiError): string {
  if (error.status === 404) {
    return 'No se pudo encontrar el producto. Puede que haya sido eliminado.';
  }
  return error.message !== '' ? error.message : genericErrorMessage;
}
