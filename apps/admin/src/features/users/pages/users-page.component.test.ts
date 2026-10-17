import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UsersPageComponent } from './users-page.component';
import { UsersInvitationService } from '../users-invitation.service';
import { RoleService } from '../../auth/role.service';
import { Usuario } from '../models';

const API_BASE = 'http://localhost:3000/api/v1';

function makeUsuario(id: string, overrides: Partial<Usuario> = {}): Usuario {
  return {
    id,
    nombre: `Usuario ${id}`,
    email: `${id}@riff.cl`,
    rol: 'editor',
    activo: true,
    estado: 'activo',
    creadoPor: 'system',
    creadoEn: '2026-10-16T10:00:00Z',
    actualizadoEn: '2026-10-16T10:00:00Z',
    ...overrides,
  };
}

type Rol = 'editor' | 'admin' | 'superadmin';

const RANK: Record<Rol, number> = { editor: 1, admin: 2, superadmin: 3 };

/** Hierarchy-aware mock mirroring RoleService.hasRole (editor < admin < superadmin). */
function roleHas(rol: Rol, required: string[]): boolean {
  if (required.length === 0) return false;
  const need = Math.min(...required.map((r) => RANK[r as Rol] ?? 0));
  return RANK[rol] >= need;
}

/** Lets promise chains (rxjs from/firstValueFrom) settle before asserting. */
async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Users list page (tasks 6.1–6.2 and 9.1–9.2, spec `admin-users`): full user
 * table with the derived estado, role-gated actions (hidden, not disabled),
 * invitation resend, and deactivate/activate with confirmation modal and
 * Spanish inline banners.
 */
describe('UsersPageComponent (tasks 6.1–6.2, 9.1–9.2)', () => {
  let fixture: ComponentFixture<UsersPageComponent>;
  let http: HttpTestingController;
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.fn>;
  let resendSpy: ReturnType<typeof vi.fn>;
  let currentRole: Rol;

  function flushUsers(items: Usuario[]): void {
    const req = http.expectOne(`${API_BASE}/users`);
    req.flush({ data: items, error: null, meta: null });
  }

  async function renderWith(items: Usuario[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(UsersPageComponent);
    fixture.detectChanges();
    flushUsers(items);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    history.replaceState({}, '');
    currentRole = 'superadmin';
    TestBed.configureTestingModule({
      imports: [UsersPageComponent],
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: RoleService,
          useValue: {
            hasRole: (...required: string[]) => roleHas(currentRole, required),
          },
        },
        {
          provide: UsersInvitationService,
          // The real service exposes Observables (rxjs interop) — the mock
          // must honor that contract or `firstValueFrom` misbehaves.
          useValue: {
            sendInvitation: vi.fn(() => of(void 0)),
            resendInvitation: vi.fn(() => of(void 0)),
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    resendSpy = TestBed.inject(UsersInvitationService).resendInvitation as ReturnType<typeof vi.fn>;
  });

  afterEach(() => {
    http.verify();
  });

  describe('[6.1] tabla', () => {
    it('renders nombre, email, rol and estado per row', async () => {
      const el = await renderWith([
        makeUsuario('u1', { rol: 'editor', estado: 'invitado', activo: true }),
        makeUsuario('u2', { rol: 'admin', estado: 'activo' }),
      ]);

      expect(el.querySelectorAll('tbody tr').length).toBe(2);
      expect(el.textContent).toContain('Usuario u1');
      expect(el.textContent).toContain('u1@riff.cl');
      expect(el.textContent).toContain('Editor');
      expect(el.textContent).toContain('Invitado');
      expect(el.textContent).toContain('Admin');
      expect(el.textContent).toContain('Activo');
    });

    it('shows the empty state when there are no users', async () => {
      const el = await renderWith([]);

      expect(el.querySelector('[data-table-empty]')?.textContent).toContain('Sin usuarios');
    });

    it('shows an error banner when the load fails', async () => {
      fixture = TestBed.createComponent(UsersPageComponent);
      fixture.detectChanges();
      const req = http.expectOne(`${API_BASE}/users`);
      req.flush(
        { data: null, error: { message: 'boom' }, meta: null },
        { status: 500, statusText: 'Server Error' },
      );
      await fixture.whenStable();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('[data-error-banner]')?.textContent).toContain(
        'No se pudo cargar el listado de usuarios.',
      );
    });

    it('consumes the invitation-failure flash error once (spec: Fallo del envío del email)', async () => {
      const el = await renderWith([makeUsuario('inv', { rol: 'editor', estado: 'invitado' })]);

      // Simulate arriving from the form's failed-invitation navigation: the
      // state is written after the initial render, then consumed explicitly
      // (deterministic against router-init state churn in the harness).
      history.replaceState(
        {
          flashError:
            'El usuario fue creado pero la invitación no pudo enviarse. Usa «Reenviar invitación» en el listado.',
        },
        '',
      );
      fixture.componentInstance.consumeFlashes();
      fixture.detectChanges();

      expect(el.querySelector('[data-error-banner]')?.textContent).toContain(
        'la invitación no pudo enviarse',
      );
      // The flash is cleared: a reload would not re-show it.
      expect((history.state as { flashError?: string }).flashError).toBeUndefined();
    });
  });

  describe('[6.2] acciones', () => {
    it('shows «Añadir usuario» for admin/superadmin and navigates to /users/new', async () => {
      const el = await renderWith([]);

      const add = el.querySelector<HTMLButtonElement>('[data-add] button');
      expect(add).not.toBeNull();
      add?.click();
      expect(navigateSpy).toHaveBeenCalledWith(['/users/new']);
    });

    it('links Editar to /users/:id for manageable rows', async () => {
      const el = await renderWith([makeUsuario('u1', { rol: 'editor' })]);

      const edit = el.querySelector<HTMLAnchorElement>('[data-edit="u1"]');
      expect(edit).not.toBeNull();
      expect(edit?.getAttribute('href')).toBe('/users/u1');
    });

    it('shows edit/toggle/resend actions only on editor rows for an admin actor', async () => {
      currentRole = 'admin';
      const el = await renderWith([
        makeUsuario('ed', { rol: 'editor', estado: 'invitado' }),
        makeUsuario('ad', { rol: 'admin' }),
      ]);

      expect(el.querySelector('[data-edit="ed"]')).not.toBeNull();
      expect(el.querySelector('[data-resend="ed"]')).not.toBeNull();
      expect(el.querySelector('[data-toggle="ed"]')).not.toBeNull();
      expect(el.querySelector('[data-edit="ad"]')).toBeNull();
      expect(el.querySelector('[data-toggle="ad"]')).toBeNull();
      expect(el.querySelector('[data-resend="ad"]')).toBeNull();
    });

    it('shows actions on admin and editor rows for a superadmin actor', async () => {
      const el = await renderWith([
        makeUsuario('ed', { rol: 'editor' }),
        makeUsuario('ad', { rol: 'admin' }),
      ]);

      expect(el.querySelector('[data-edit="ed"]')).not.toBeNull();
      expect(el.querySelector('[data-edit="ad"]')).not.toBeNull();
      expect(el.querySelector('[data-toggle="ad"]')).not.toBeNull();
    });

    it('labels the toggle per row state (Desactivar / Activar)', async () => {
      const el = await renderWith([
        makeUsuario('on', { rol: 'editor', activo: true }),
        makeUsuario('off', { rol: 'editor', activo: false }),
      ]);

      expect(el.querySelector('[data-toggle="on"]')?.textContent?.trim()).toBe('Desactivar');
      expect(el.querySelector('[data-toggle="off"]')?.textContent?.trim()).toBe('Activar');
    });

    it('shows «Reenviar invitación» only for invitado rows', async () => {
      const el = await renderWith([
        makeUsuario('inv', { rol: 'editor', estado: 'invitado' }),
        makeUsuario('act', { rol: 'editor', estado: 'activo' }),
      ]);

      expect(el.querySelector('[data-resend="inv"]')).not.toBeNull();
      expect(el.querySelector('[data-resend="act"]')).toBeNull();
    });

    it('re-sends the invitation and shows the success banner', async () => {
      const el = await renderWith([makeUsuario('inv', { rol: 'editor', estado: 'invitado' })]);

      el.querySelector<HTMLButtonElement>('[data-resend="inv"]')?.click();
      await flushAsync();
      fixture.detectChanges();

      expect(resendSpy).toHaveBeenCalledWith('inv@riff.cl');
      expect(el.querySelector('[data-success-banner]')?.textContent).toContain(
        'Invitación reenviada.',
      );
    });

    it('shows an error banner when the resend fails', async () => {
      resendSpy.mockReturnValue(throwError(() => new Error('auth/network-request-failed')));
      const el = await renderWith([makeUsuario('inv', { rol: 'editor', estado: 'invitado' })]);

      el.querySelector<HTMLButtonElement>('[data-resend="inv"]')?.click();
      await flushAsync();
      fixture.detectChanges();

      expect(el.querySelector('[data-error-banner]')?.textContent).toContain(
        'No se pudo reenviar la invitación.',
      );
    });
  });

  describe('[9.1] baja lógica', () => {
    it('deactivates after modal confirmation and shows the success banner', async () => {
      let el = await renderWith([makeUsuario('u1', { rol: 'editor', activo: true })]);

      el.querySelector<HTMLButtonElement>('[data-toggle="u1"]')?.click();
      fixture.detectChanges();
      expect(el.querySelector('[role="dialog"]')).not.toBeNull();

      el.querySelector<HTMLButtonElement>('[data-modal-confirm]')?.click();
      await flushAsync();
      fixture.detectChanges();
      const patch = http.expectOne(`${API_BASE}/users/u1`);
      expect(patch.request.method).toBe('PATCH');
      expect(patch.request.body).toEqual({ activo: false });
      patch.flush({ data: { ...makeUsuario('u1'), activo: false }, error: null, meta: null });
      await flushAsync();
      const reload = http.expectOne(`${API_BASE}/users`);
      reload.flush({ data: [makeUsuario('u1', { activo: false })], error: null, meta: null });
      await fixture.whenStable();
      fixture.detectChanges();
      el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('[data-success-banner]')?.textContent).toContain(
        'Usuario desactivado con éxito.',
      );
      expect(el.querySelector('[data-toggle="u1"]')?.textContent?.trim()).toBe('Activar');
    });

    it('activates an inactive user without leaving the list', async () => {
      let el = await renderWith([makeUsuario('u1', { rol: 'editor', activo: false })]);

      el.querySelector<HTMLButtonElement>('[data-toggle="u1"]')?.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[data-modal-confirm]')?.click();
      await flushAsync();
      fixture.detectChanges();
      const patch = http.expectOne(`${API_BASE}/users/u1`);
      expect(patch.request.body).toEqual({ activo: true });
      patch.flush({ data: { ...makeUsuario('u1'), activo: true }, error: null, meta: null });
      await flushAsync();
      const reload = http.expectOne(`${API_BASE}/users`);
      reload.flush({ data: [makeUsuario('u1', { activo: true })], error: null, meta: null });
      await fixture.whenStable();
      fixture.detectChanges();
      el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector('[data-success-banner]')?.textContent).toContain(
        'Usuario activado con éxito.',
      );
    });

    it('closes the modal without calling the API on cancel', async () => {
      const el = await renderWith([makeUsuario('u1', { rol: 'editor', activo: true })]);

      el.querySelector<HTMLButtonElement>('[data-toggle="u1"]')?.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[data-modal-cancel]')?.click();
      fixture.detectChanges();

      expect(el.querySelector('[role="dialog"]')).toBeNull();
      http.expectNone(() => true);
    });
  });

  describe('[9.2] errores de la baja lógica', () => {
    it('maps the 409 last-superadmin conflict to a Spanish banner', async () => {
      await renderWith([makeUsuario('sa', { rol: 'superadmin', activo: true })]);
      // Superadmin rows hide their actions (matrix), so drive the flow through
      // the component API to exercise the banner mapping itself.
      fixture.componentInstance.askToggle(makeUsuario('sa', { rol: 'superadmin' }));
      fixture.detectChanges();

      fixture.componentInstance.confirmToggle();
      await flushAsync();
      fixture.detectChanges();
      const patch = http.expectOne(`${API_BASE}/users/sa`);
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

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[data-error-banner]')?.textContent,
      ).toContain('No se puede dejar el sistema sin un superadmin activo.');
    });

    it('maps a 403 to the permission banner and keeps the row state', async () => {
      currentRole = 'admin';
      const el = await renderWith([makeUsuario('ed', { rol: 'editor', activo: true })]);

      el.querySelector<HTMLButtonElement>('[data-toggle="ed"]')?.click();
      fixture.detectChanges();
      el.querySelector<HTMLButtonElement>('[data-modal-confirm]')?.click();
      await flushAsync();
      fixture.detectChanges();
      const patch = http.expectOne(`${API_BASE}/users/ed`);
      patch.flush(
        { data: null, error: { message: 'Insufficient role' }, meta: null },
        { status: 403, statusText: 'Forbidden' },
      );
      await flushAsync();
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector('[data-error-banner]')?.textContent,
      ).toContain('No tienes permisos para esta acción.');
      expect(el.querySelector('[data-toggle="ed"]')?.textContent?.trim()).toBe('Desactivar');
    });
  });
});
