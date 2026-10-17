import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { SidebarService } from '../../services/sidebar.service';
import { AppSidebarWidgetComponent } from './app-sidebar-widget.component';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { RoleService } from '../../../features/auth/role.service';
import { UsuarioRol } from '../../../features/auth/auth.models';

interface NavItem {
  name: string;
  path: string;
  icon: string;
  /**
   * Lowest role that sees the item (hierarchy-aware via RoleService). Items
   * without it are always visible to authenticated users. Hidden, never
   * disabled (spec `admin-role-access`, design D6).
   */
  minRole?: UsuarioRol;
}

/**
 * Sidebar (ported from TailAdmin's `app-sidebar`, adapted to Riff tokens and
 * signals — design D1). Foundation lists only the implemented sections; the
 * later panel changes append their items to `NAV_ITEMS`.
 */
@Component({
  selector: 'app-sidebar',
  imports: [NgClass, RouterLink, AppSidebarWidgetComponent, SafeHtmlPipe],
  templateUrl: './app-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent {
  readonly sidebar = inject(SidebarService);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);

  private static readonly USER_ICON = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 3.5C7.30558 3.5 3.5 7.30558 3.5 12C3.5 14.1526 4.3002 16.1184 5.61936 17.616C6.17279 15.3096 8.24852 13.5955 10.7246 13.5955H13.2746C15.7509 13.5955 17.8268 15.31 18.38 17.6167C19.6996 16.119 20.5 14.153 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5ZM17.0246 18.8566V18.8455C17.0246 16.7744 15.3457 15.0955 13.2746 15.0955H10.7246C8.65354 15.0955 6.97461 16.7744 6.97461 18.8455V18.856C8.38223 19.8895 10.1198 20.5 12 20.5C13.8798 20.5 15.6171 19.8898 17.0246 18.8566ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12ZM11.9991 7.25C10.8847 7.25 9.98126 8.15342 9.98126 9.26784C9.98126 10.3823 10.8847 11.2857 11.9991 11.2857C13.1135 11.2857 14.0169 10.3823 14.0169 9.26784C14.0169 8.15342 13.1135 7.25 11.9991 7.25ZM8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75C13.9419 5.75 15.5169 7.32499 15.5169 9.26784C15.5169 11.2107 13.9419 12.7857 11.9991 12.7857C10.0563 12.7857 8.48126 11.2107 8.48126 9.26784C8.48126 7.32499 10.0563 5.75 11.9991 5.75Z" fill="currentColor"></path></svg>`;

  private static readonly PRODUCTS_ICON = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 7.5L12 12L3 7.5M12 12V21.5M12 12L21 7.5V16.5L12 21.5L3 16.5V7.5L12 3L21 7.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  private static readonly CATEGORIES_ICON = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7C3 5.89543 3.89543 5 5 5H9L11 7.5H19C20.1046 7.5 21 8.39543 21 9.5V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

  private static readonly USERS_ICON = `<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 19V17C16 15.9391 15.5786 14.9217 14.8284 14.1716C14.0783 13.4214 13.0609 13 12 13H6C4.93913 13 3.92172 13.4214 3.17157 14.1716C2.42143 14.9217 2 15.9391 2 17V19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 19V17C21.9996 16.1137 21.7041 15.2528 21.1608 14.5523C20.6174 13.8519 19.8582 13.3536 19 13.13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 3.13C15.8604 3.35031 16.623 3.85071 17.1676 4.55232C17.7122 5.25392 18.0078 6.11683 18.0078 7.005C18.0078 7.89318 17.7122 8.75608 17.1676 9.45769C16.623 10.1593 15.8604 10.6597 15 10.88" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /** Implemented sections (spec deltas `admin-app-shell`, `admin-panel-content`, `admin-users`). */
  readonly navItems: NavItem[] = [
    { name: 'Productos', path: '/products', icon: AppSidebarComponent.PRODUCTS_ICON },
    { name: 'Categorías', path: '/categories', icon: AppSidebarComponent.CATEGORIES_ICON },
    {
      name: 'Usuarios',
      path: '/users',
      icon: AppSidebarComponent.USERS_ICON,
      minRole: 'admin',
    },
    { name: 'Perfil', path: '/profile', icon: AppSidebarComponent.USER_ICON },
  ];

  /** Items the signed-in role may see (ocultar, no deshabilitar — D6). */
  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(
      (item) => !item.minRole || this.roleService.hasRole(item.minRole),
    );
  }

  constructor() {
    // Close the mobile drawer after every successful navigation.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.sidebar.setMobileOpen(false));
  }

  /** Exact/child match against the current router URL. */
  isActive(path: string): boolean {
    return this.router.url === path || this.router.url.startsWith(`${path}/`);
  }

  get expanded(): boolean {
    return this.sidebar.isExpanded() || this.sidebar.isHovered() || this.sidebar.isMobileOpen();
  }

  get asideClasses(): Record<string, boolean> {
    return {
      'w-[290px]': this.expanded,
      'w-[90px]': !this.expanded,
      'translate-x-0': this.sidebar.isMobileOpen(),
      'max-xl:-translate-x-full': !this.sidebar.isMobileOpen(),
    };
  }

  get logoClasses(): Record<string, boolean> {
    return {
      'xl:justify-center': !this.expanded,
      'justify-start': this.expanded,
    };
  }

  onSidebarMouseEnter(): void {
    if (!this.sidebar.isExpanded() && !this.sidebar.isMobileOpen()) {
      this.sidebar.setHovered(true);
    }
  }

  onSidebarMouseLeave(): void {
    this.sidebar.setHovered(false);
  }
}
