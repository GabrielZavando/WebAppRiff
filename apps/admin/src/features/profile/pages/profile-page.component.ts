import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AdminUserProfile } from '../../auth/auth.models';
import { ProfileService } from '../profile.service';

const ROLE_LABELS: Record<AdminUserProfile['rol'], string> = {
  editor: 'Editor',
  admin: 'Administrador',
  superadmin: 'Superadministrador',
};

/**
 * Read-only profile page (task 6.2 / spec `admin-profile`): shows the
 * signed-in user's name, email and role from `GET /api/v1/auth/me`. No
 * editing controls — the only mutable data lives in later module changes.
 */
@Component({
  selector: 'app-profile-page',
  imports: [],
  templateUrl: './profile-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly profileService = inject(ProfileService);

  readonly profile = signal<AdminUserProfile | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  get roleLabel(): string {
    const rol = this.profile()?.rol;
    return rol === undefined ? '' : (ROLE_LABELS[rol] ?? rol);
  }

  async ngOnInit(): Promise<void> {
    try {
      this.profile.set(await firstValueFrom(this.profileService.getProfile()));
    } catch {
      this.error.set('No se pudo cargar el perfil. Intenta de nuevo más tarde.');
    } finally {
      this.loading.set(false);
    }
  }
}
