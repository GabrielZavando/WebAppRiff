import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiClientService } from '../../shared/api/api-client.service';
import { Usuario, UsuarioCreatePayload, UsuarioUpdatePayload } from './models';

/**
 * Users domain service (task 4.2): speaks to `/users` through
 * `ApiClientService`, which unwraps the standard envelope and normalizes
 * failures into `ApiError`. There is no `remove`: the panel deactivates users
 * via `update(id, { activo: false })` (design D2 — no DELETE endpoint exists),
 * and invitations are sent by `UsersInvitationService`, not here (design D3).
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiClientService);

  findAll(): Observable<Usuario[]> {
    return this.api.get<Usuario[]>('users');
  }

  findById(id: string): Observable<Usuario> {
    return this.api.get<Usuario>(`users/${id}`);
  }

  create(payload: UsuarioCreatePayload): Observable<Usuario> {
    return this.api.post<Usuario>('users', payload);
  }

  update(id: string, payload: UsuarioUpdatePayload): Observable<Usuario> {
    return this.api.patch<Usuario>(`users/${id}`, payload);
  }
}
