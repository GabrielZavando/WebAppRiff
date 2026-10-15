import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { ApiClientService } from '../../shared/api/api-client.service';
import {
  Producto,
  ProductoCreatePayload,
  ProductoListMeta,
  ProductoListQuery,
  ProductoUpdatePayload,
} from './models';

/**
 * Product domain service (task 3.4, design D1/D2/D3): speaks to `/products`
 * through `ApiClientService`. The list uses `getWithMeta` because pagination
 * stats ride on the envelope `meta` (contract `api-products-pagination`);
 * `meta.total` non-numeric or absent normalizes to `null` — the counter must
 * not fall back to the page count.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiClientService);

  findAll(query: ProductoListQuery): Observable<{ items: Producto[]; meta: ProductoListMeta | null }> {
    return this.api
      .getWithMeta<Producto[]>(this.buildPath(query))
      .pipe(map(({ data, meta }) => ({ items: data, meta: this.parseMeta(meta) })));
  }

  findById(id: string): Observable<Producto> {
    return this.api.get<Producto>(`products/${id}`);
  }

  create(payload: ProductoCreatePayload): Observable<Producto> {
    return this.api.post<Producto>('products', payload);
  }

  update(id: string, payload: ProductoUpdatePayload): Observable<Producto> {
    return this.api.patch<Producto>(`products/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`products/${id}`);
  }

  private buildPath(query: ProductoListQuery): string {
    const params = new URLSearchParams();
    params.set('page', String(query.page));
    params.set('limit', String(query.limit));
    if (query.search !== undefined && query.search.trim() !== '') {
      params.set('search', query.search.trim());
    }
    if (query.categoriaId !== undefined && query.categoriaId !== '') {
      params.set('categoriaId', query.categoriaId);
    }
    return `products?${params.toString()}`;
  }

  /** Keeps `meta` only when every pagination stat is numeric (design Riesgos). */
  private parseMeta(meta: Record<string, unknown> | null): ProductoListMeta | null {
    if (meta === null) {
      return null;
    }
    const { page, limit, total } = meta as Partial<ProductoListMeta>;
    if (
      typeof page !== 'number' ||
      typeof limit !== 'number' ||
      typeof total !== 'number' ||
      !Number.isFinite(page) ||
      !Number.isFinite(limit) ||
      !Number.isFinite(total)
    ) {
      return null;
    }
    return { page, limit, total };
  }
}
