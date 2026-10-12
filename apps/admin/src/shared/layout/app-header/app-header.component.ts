import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

import { SidebarService } from '../../services/sidebar.service';
import { AuthService } from '../../../features/auth/auth.service';
import { DropdownComponent } from '../../components/ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../components/ui/dropdown/dropdown-item/dropdown-item.component';
import { AvatarComponent } from '../../components/ui/avatar/avatar.component';

const SECTION_TITLES: Record<string, string> = {
  '/profile': 'Perfil',
};

/**
 * Header (ported from TailAdmin's `app-header`, adapted to Riff tokens —
 * design D1). Foundation keeps the sidebar toggle, the mobile brand link and
 * the user menu (avatar + dropdown with logout); search, notifications and
 * theme toggles are TailAdmin extras not used by the Riff panel.
 */
@Component({
  selector: 'app-header',
  imports: [NgClass, RouterLink, DropdownComponent, DropdownItemComponent, AvatarComponent],
  templateUrl: './app-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeaderComponent {
  readonly sidebar = inject(SidebarService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly userMenuOpen = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Active section title shown in the header (spec `admin-app-shell`). */
  readonly sectionTitle = computed<string>(() => {
    const url = this.currentUrl();
    const match = Object.entries(SECTION_TITLES).find(([path]) => url.startsWith(path));
    return match?.[1] ?? 'Panel';
  });

  get userInitials(): string {
    const profile = this.authService.currentUser();
    if (profile === null) {
      return '?';
    }
    return profile.nombre
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }

  handleToggle(): void {
    if (window.innerWidth >= 1280) {
      this.sidebar.toggleExpanded();
    } else {
      this.sidebar.toggleMobileOpen();
    }
  }

  toggleUserMenu(event?: Event): void {
    event?.stopPropagation();
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeUserMenu();
    await this.authService.logout();
  }
}
