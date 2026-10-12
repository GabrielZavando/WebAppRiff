import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '../../shared/api/api-client.service';
import { AdminUserProfile } from '../auth/auth.models';

/**
 * Profile data source (task 6.1 / spec `admin-profile`): exposes the
 * signed-in user's profile from `GET /api/v1/auth/me`. The page is read-only
 * by design — no mutation endpoints are consumed.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiClientService);

  getProfile(): Observable<AdminUserProfile> {
    return this.api.get<AdminUserProfile>('auth/me');
  }
}
