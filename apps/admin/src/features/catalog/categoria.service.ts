import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../shared/api/api-client.service';
import { Categoria, CategoriaCreatePayload, CategoriaUpdatePayload } from './models';

/**
 * Category domain service (task 3.2, design D2/D3): speaks to `/categories`
 * through `ApiClientService`, which unwraps the standard envelope and
 * normalizes failures into `ApiError`. Lists fetch the full catalog (no
 * `?activa` filter) so the admin sees inactive categories too (design D6).
 */
@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private readonly api = inject(ApiClientService);

  findAll(): Observable<Categoria[]> {
    return this.api.get<Categoria[]>('categories');
  }

  findById(id: string): Observable<Categoria> {
    return this.api.get<Categoria>(`categories/${id}`);
  }

  create(payload: CategoriaCreatePayload): Observable<Categoria> {
    return this.api.post<Categoria>('categories', payload);
  }

  update(id: string, payload: CategoriaUpdatePayload): Observable<Categoria> {
    return this.api.patch<Categoria>(`categories/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`categories/${id}`);
  }
}
