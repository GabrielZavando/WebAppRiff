import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AuthService } from '../../../features/auth/auth.service';
import { AdminUserProfile } from '../../../features/auth/auth.models';
import { SidebarService } from '../../services/sidebar.service';
import { AppHeaderComponent } from './app-header.component';

const PROFILE: AdminUserProfile = {
  id: 'uid-1',
  nombre: 'Ada Lovelace',
  email: 'ada@riff.cl',
  rol: 'admin',
  activo: true,
};

/**
 * Contract (task 4.3 / spec `admin-app-shell` + `admin-auth`): the header
 * shows the signed-in user (avatar + name), the active section title, and a
 * user menu with a working logout action.
 */
describe('AppHeaderComponent (task 4.3)', () => {
  let fixture: ComponentFixture<AppHeaderComponent>;
  let profileSignal: ReturnType<typeof signal<AdminUserProfile | null>>;
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    await ɵresolveComponentResources(async (url: string) =>
      readFileSync(resolve(testDir, url), 'utf-8'),
    );

    profileSignal = signal<AdminUserProfile | null>(PROFILE);
    logout = vi.fn().mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [AppHeaderComponent],
      providers: [
        provideRouter([]),
        SidebarService,
        { provide: AuthService, useValue: { currentUser: profileSignal.asReadonly(), logout } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppHeaderComponent);
    fixture.detectChanges();
  });

  it('renders the current user name and avatar initials', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Ada Lovelace');
    expect(element.textContent).toContain('AL');
  });

  it('shows the active section title', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Panel');
  });

  it('opens the user menu with the logout action', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).not.toContain('Cerrar sesión');

    const toggle = element.querySelector<HTMLButtonElement>('.dropdown-toggle');
    toggle?.click();
    fixture.detectChanges();

    expect(element.textContent).toContain('Cerrar sesión');
    expect(element.textContent).toContain(PROFILE.email);
  });

  it('calls AuthService.logout from the menu action', async () => {
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector<HTMLButtonElement>('.dropdown-toggle')?.click();
    fixture.detectChanges();

    const logoutItem = [...element.querySelectorAll<HTMLButtonElement>('app-dropdown-item button')]
      .find((button) => button.textContent?.includes('Cerrar sesión'));
    expect(logoutItem).toBeDefined();
    logoutItem?.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('toggles the mobile drawer through the service on narrow viewports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const service = TestBed.inject(SidebarService);

    const toggle = element.querySelector<HTMLButtonElement>('[aria-label="Toggle Sidebar"]');
    toggle?.click();

    expect(service.isMobileOpen()).toBe(true);
  });

  it('toggles the expanded state on xl+ viewports', () => {
    const element = fixture.nativeElement as HTMLElement;
    const service = TestBed.inject(SidebarService);
    vi.stubGlobal('innerWidth', 1440);
    try {
      const expandedBefore = service.isExpanded();
      const toggle = element.querySelector<HTMLButtonElement>('[aria-label="Toggle Sidebar"]');
      toggle?.click();
      expect(service.isExpanded()).toBe(!expandedBefore);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
