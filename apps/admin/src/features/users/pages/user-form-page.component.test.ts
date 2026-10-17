import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserFormPageComponent } from './user-form-page.component';
import { UsersInvitationService } from '../users-invitation.service';
import { RoleService } from '../../auth/role.service';

const API_BASE = 'http://localhost:3000/api/v1';

type Rol = 'editor' | 'admin' | 'superadmin';
const RANK: Record<Rol, number> = { editor: 1, admin: 2, superadmin: 3 };

function roleHas(rol: Rol, required: string[]): boolean {
  if (required.length === 0) return false;
  const need = Math.min(...required.map((r) => RANK[r as Rol] ?? 0));
  return RANK[rol] >= need;
}

/**
 * User creation form (tasks 7.1–7.2, spec `admin-users`): nombre + email +
 * role select per actor, NO password field (invitation flow), disabled save
 * while invalid, POST then invitation dispatch with Spanish banners.
 */
describe('UserFormPageComponent — creación (tasks 7.1–7.2)', () => {
  let fixture: ComponentFixture<UserFormPageComponent>;
  let http: HttpTestingController;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let sendSpy: ReturnType<typeof vi.fn>;
  let currentRole: Rol;
  let currentRouteId: string | null;

  async function renderCreate(): Promise<HTMLElement> {
    fixture = TestBed.createComponent(UserFormPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function fillValid(): void {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '[data-form-nombre]',
    )!.value = 'Ana';
    (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>('[data-form-nombre]')!.dispatchEvent(new Event('input'));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      '[data-form-email]',
    )!.value = 'ana@riff.cl';
    (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLInputElement>('[data-form-email]')!.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /** jsdom does not dispatch submit on button click — the form does (catalog pattern). */
  function submitForm(): void {
    (fixture.nativeElement as HTMLElement).querySelector('form')?.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  }

  /** Lets promise chains (rxjs from/firstValueFrom) settle before asserting. */
  async function flushAsync(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  beforeEach(() => {
    history.replaceState({}, '');
    currentRole = 'superadmin';
    currentRouteId = null;
    TestBed.configureTestingModule({
      imports: [UserFormPageComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: RoleService,
          useValue: { hasRole: (...required: string[]) => roleHas(currentRole, required) },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (key: string) => (key === 'id' ? currentRouteId : null) } },
          },
        },
        {
          provide: UsersInvitationService,
          useValue: { sendInvitation: vi.fn(() => of(void 0)), resendInvitation: vi.fn() },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    sendSpy = TestBed.inject(UsersInvitationService).sendInvitation as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    http.verify();
  });

  describe('[7.1] formulario', () => {
    it('renders nombre, email and role select — without any password field', async () => {
      const el = await renderCreate();

      expect(el.querySelector('[data-form-nombre]')).not.toBeNull();
      expect(el.querySelector('[data-form-email]')).not.toBeNull();
      expect(el.querySelector('[data-form-rol]')).not.toBeNull();
      expect(el.querySelector('input[type="password"]')).toBeNull();
    });

    it('offers admin and editor roles to a superadmin (never superadmin)', async () => {
      const el = await renderCreate();

      const options = Array.from(el.querySelectorAll<HTMLOptionElement>('[data-form-rol] option'));
      expect(options.map((o) => o.value)).toEqual(['editor', 'admin']);
    });

    it('offers only the editor role to an admin', async () => {
      currentRole = 'admin';
      const el = await renderCreate();

      const options = Array.from(el.querySelectorAll<HTMLOptionElement>('[data-form-rol] option'));
      expect(options.map((o) => o.value)).toEqual(['editor']);
    });

    it('keeps the save button disabled while the form is invalid', async () => {
      const el = await renderCreate();

      const save = el.querySelector<HTMLButtonElement>('[data-form-save] button');
      expect(save?.disabled).toBe(true);
    });

    it('flags a missing nombre after touching and validates the email format', async () => {
      const el = await renderCreate();

      // Touch both fields (blur) → required errors appear per field.
      el.querySelector<HTMLInputElement>('[data-form-nombre]')?.dispatchEvent(new Event('blur'));
      el.querySelector<HTMLInputElement>('[data-form-email]')?.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(el.querySelector('[data-error-nombre]')?.textContent).toContain('obligatorio');
      expect(el.querySelector('[data-error-email]')?.textContent).toContain('correo');

      // Invalid email format keeps the form invalid.
      const email = el.querySelector<HTMLInputElement>('[data-form-email]')!;
      email.value = 'no-es-un-correo';
      email.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
          '[data-form-save] button',
        )!.disabled,
      ).toBe(true);
    });
  });

  describe('[7.2] envío e invitación', () => {
    it('POSTs without password, sends the invitation and flashes the list', async () => {
      await renderCreate();
      fillValid();

      submitForm();
      await flushAsync();

      const post = http.expectOne(`${API_BASE}/users`);
      expect(post.request.method).toBe('POST');
      expect(post.request.body).toEqual({ nombre: 'Ana', email: 'ana@riff.cl', rol: 'editor' });
      expect(post.request.body).not.toHaveProperty('password');
      post.flush(
        {
          data: {
            id: 'uid-1',
            nombre: 'Ana',
            email: 'ana@riff.cl',
            rol: 'editor',
            activo: true,
            estado: 'invitado',
            creadoPor: 'sa',
            creadoEn: 't',
            actualizadoEn: 't',
          },
          error: null,
          meta: null,
        },
        { status: 201, statusText: 'Created' },
      );
      await flushAsync();

      expect(sendSpy).toHaveBeenCalledWith('ana@riff.cl');
      expect(navigateSpy).toHaveBeenCalledWith(['/users'], {
        state: { flash: 'created' },
      });
    });

    it('lets a superadmin create an admin (POST with rol admin)', async () => {
      const el = await renderCreate();
      fillValid();
      const select = el.querySelector<HTMLSelectElement>('[data-form-rol]')!;
      select.value = 'admin';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      submitForm();
      await flushAsync();

      const post = http.expectOne(`${API_BASE}/users`);
      expect(post.request.body).toEqual({ nombre: 'Ana', email: 'ana@riff.cl', rol: 'admin' });
      post.flush(
        {
          data: {
            id: 'uid-2',
            nombre: 'Ana',
            email: 'ana@riff.cl',
            rol: 'admin',
            activo: true,
            estado: 'invitado',
            creadoPor: 'sa',
            creadoEn: 't',
            actualizadoEn: 't',
          },
          error: null,
          meta: null,
        },
        { status: 201, statusText: 'Created' },
      );
      await flushAsync();

      expect(sendSpy).toHaveBeenCalledWith('ana@riff.cl');
      expect(navigateSpy).toHaveBeenCalledWith(['/users'], { state: { flash: 'created' } });
    });

    it('stays on the form with a Spanish banner when the POST fails', async () => {
      const el = await renderCreate();
      fillValid();

      submitForm();
      await flushAsync();

      const post = http.expectOne(`${API_BASE}/users`);
      post.flush(
        { data: null, error: { message: 'Insufficient permissions to create this role' }, meta: null },
        { status: 403, statusText: 'Forbidden' },
      );
      await flushAsync();
      fixture.detectChanges();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(sendSpy).not.toHaveBeenCalled();
      expect(el.querySelector('[data-form-error]')?.textContent).toContain(
        'No tienes permisos',
      );
    });

    it('navigates to the list with an error flash when the invitation fails after 201', async () => {
      sendSpy.mockReturnValue(throwError(() => new Error('auth/network-request-failed')));
      await renderCreate();
      fillValid();

      submitForm();
      await flushAsync();

      const post = http.expectOne(`${API_BASE}/users`);
      post.flush(
        {
          data: {
            id: 'uid-1',
            nombre: 'Ana',
            email: 'ana@riff.cl',
            rol: 'editor',
            activo: true,
            estado: 'invitado',
            creadoPor: 'sa',
            creadoEn: 't',
            actualizadoEn: 't',
          },
          error: null,
          meta: null,
        },
        { status: 201, statusText: 'Created' },
      );
      await flushAsync();

      expect(sendSpy).toHaveBeenCalledWith('ana@riff.cl');
      expect(navigateSpy).toHaveBeenCalledWith(['/users'], {
        state: {
          flashError:
            'El usuario fue creado pero la invitación no pudo enviarse. Usa «Reenviar invitación» en el listado.',
        },
      });
    });
  });

  describe('edición (tasks 8.1–8.2)', () => {
    const EXISTING = {
      id: 'uid-1',
      nombre: 'Ana',
      email: 'ana@riff.cl',
      rol: 'editor',
      activo: true,
      estado: 'activo',
      creadoPor: 'sa',
      creadoEn: 't',
      actualizadoEn: 't',
    };

    async function renderEdit(id = 'uid-1'): Promise<HTMLElement> {
      currentRouteId = id;
      fixture = TestBed.createComponent(UserFormPageComponent);
      fixture.detectChanges();
      const req = http.expectOne(`${API_BASE}/users/${id}`);
      req.flush({ data: { ...EXISTING, id }, error: null, meta: null });
      await fixture.whenStable();
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    it('[8.1] preloads the user and keeps the email read-only', async () => {
      const el = await renderEdit();

      expect((el.querySelector('[data-form-nombre]') as HTMLInputElement).value).toBe('Ana');
      const email = el.querySelector<HTMLInputElement>('[data-form-email]')!;
      expect(email.value).toBe('ana@riff.cl');
      expect(email.readOnly).toBe(true);
    });

    it('[8.1] shows the role select to a superadmin with the current role', async () => {
      const el = await renderEdit();

      const select = el.querySelector<HTMLSelectElement>('[data-form-rol]')!;
      expect(select).not.toBeNull();
      expect(select.value).toBe('editor');
    });

    it('[8.1] hides the role select from an admin', async () => {
      currentRole = 'admin';
      const el = await renderEdit();

      expect(el.querySelector('[data-form-rol]')).toBeNull();
    });

    it('[8.2] submits PATCH with nombre and rol for a superadmin and flashes updated', async () => {
      const el = await renderEdit();
      const nombre = el.querySelector<HTMLInputElement>('[data-form-nombre]')!;
      nombre.value = 'Ana R';
      nombre.dispatchEvent(new Event('input'));
      // Superadmin promotes the editor to admin (spec: Superadmin cambia el rol).
      const select = el.querySelector<HTMLSelectElement>('[data-form-rol]')!;
      select.value = 'admin';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      submitForm();
      await flushAsync();

      const patch = http.expectOne(`${API_BASE}/users/uid-1`);
      expect(patch.request.method).toBe('PATCH');
      expect(patch.request.body).toEqual({ nombre: 'Ana R', rol: 'admin' });
      patch.flush(
        { data: { ...EXISTING, nombre: 'Ana R', rol: 'admin' }, error: null, meta: null },
      );
      await flushAsync();

      expect(navigateSpy).toHaveBeenCalledWith(['/users'], { state: { flash: 'updated' } });
    });

    it('[8.2] submits PATCH without rol for an admin', async () => {
      currentRole = 'admin';
      await renderEdit();

      submitForm();
      await flushAsync();

      const patch = http.expectOne(`${API_BASE}/users/uid-1`);
      expect(patch.request.body).toEqual({ nombre: 'Ana' });
      patch.flush({ data: EXISTING, error: null, meta: null });
      await flushAsync();

      expect(navigateSpy).toHaveBeenCalledWith(['/users'], { state: { flash: 'updated' } });
    });

    it('[8.2] maps the 409 last-superadmin conflict to a Spanish banner and stays', async () => {
      const el = await renderEdit('sa-1');

      submitForm();
      await flushAsync();

      const patch = http.expectOne(`${API_BASE}/users/sa-1`);
      patch.flush(
        {
          data: null,
          error: { message: 'Cannot leave the system without an active superadmin' },
          meta: null,
        },
        { status: 409, statusText: 'Conflict' },
      );
      await flushAsync();
      fixture.detectChanges();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(el.querySelector('[data-form-error]')?.textContent).toContain(
        'No se puede dejar el sistema sin un superadmin activo.',
      );
    });

    it('[8.2] maps a 403 to the permission banner and stays', async () => {
      const el = await renderEdit();

      submitForm();
      await flushAsync();

      const patch = http.expectOne(`${API_BASE}/users/uid-1`);
      patch.flush(
        { data: null, error: { message: 'Only superadmin can change roles' }, meta: null },
        { status: 403, statusText: 'Forbidden' },
      );
      await flushAsync();
      fixture.detectChanges();

      expect(navigateSpy).not.toHaveBeenCalled();
      expect(el.querySelector('[data-form-error]')?.textContent).toContain(
        'Solo un superadmin puede cambiar roles.',
      );
    });
  });
});
