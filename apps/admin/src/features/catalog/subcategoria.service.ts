import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../shared/api/api-client.service';
import {
  Subcategoria,
  SubcategoriaCreatePayload,
  SubcategoriaUpdatePayload,
} from './models';

/**
 * Subcategory domain service (task 3.3, design D2/D3): speaks to
 * `/subcategories` through `ApiClientService`. The list is filtered
 * server-side by parent category (`?categoriaId=`).
 */
@Injectable({ providedIn: 'root' })
export class SubcategoriaService {
  private readonly api = inject(ApiClientService);

  findByCategoria(categoriaId: string): Observable<Subcategoria[]> {
    return this.api.get<Subcategoria[]>(
      `subcategories?categoriaId=${encodeURIComponent(categoriaId)}`,
    );
  }

  findById(id: string): Observable<Subcategoria> {
    return this.api.get<Subcategoria>(`subcategories/${id}`);
  }

  create(payload: SubcategoriaCreatePayload): Observable<Subcategoria> {
    return this.api.post<Subcategoria>('subcategories', payload);
  }

  update(id: string, payload: SubcategoriaUpdatePayload): Observable<Subcategoria> {
    return this.api.patch<Subcategoria>(`subcategories/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`subcategories/${id}`);
  }
}
