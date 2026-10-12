import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ɵresolveComponentResources } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AdminUserProfile } from '../../auth/auth.models';
import { ProfilePageComponent } from './profile-page.component';

/**
 * Contract (task 6.2 / spec `admin-profile`): the /profile page shows the
 * signed-in user's name, email and role from `GET /api/v1/auth/me`, and
 * offers no editing controls at all.
 */
describe('ProfilePageComponent (task 6.2)', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let http: HttpTestingController;

  const PROFILE: AdminUserProfile = {
    id: 'uid-1',
    nombre: 'Ada Lovelace',
    email: 'ada@riff.cl',
    rol: 'superadmin',
    activo: true,
  };

  beforeEach(async () => {
    const testDir = dirname(fileURLToPath(import.meta.url));
    await ɵresolveComponentResources(async (url: string) =>
      readFileSync(resolve(testDir, url), 'utf-8'),
    );

    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('renders name, email and role from /auth/me', async () => {
    fixture.detectChanges();

    const req = http.expectOne('http://localhost:3000/api/v1/auth/me');
    req.flush({ data: PROFILE, error: null, meta: null });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('ada@riff.cl');
    expect(text).toContain('Superadministrador');
  });

  it('offers no editing controls', async () => {
    fixture.detectChanges();
    http.expectOne('http://localhost:3000/api/v1/auth/me')
      .flush({ data: PROFILE, error: null, meta: null });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('input, select, textarea, form')).toBeNull();
    expect(element.querySelector('button')).toBeNull();
  });

  it('shows a loading state while the profile is being fetched', () => {
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Cargando');

    // Satisfy the afterEach verification: the request stays pending here.
    http.expectOne('http://localhost:3000/api/v1/auth/me')
      .flush({ data: PROFILE, error: null, meta: null });
  });
});
