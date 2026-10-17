import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { UsersService } from './users.service';
import { Usuario, UsuarioCreatePayload } from './models';

const API_BASE = 'http://localhost:3000/api/v1';
const USUARIO: Usuario = {
  id: 'uid-1',
  nombre: 'Ana',
  email: 'ana@riff.cl',
  rol: 'editor',
  activo: true,
  estado: 'invitado',
  creadoPor: 'system',
  creadoEn: '2026-10-16T10:00:00Z',
  actualizadoEn: '2026-10-16T10:00:00Z',
};

/** Contract (task 4.2): UsersService speaks to /users via ApiClientService. */
describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('fetches the full user list from /users (no pagination)', () => {
    let result: Usuario[] | undefined;

    service.findAll().subscribe((usuarios) => (result = usuarios));

    const req = http.expectOne(`${API_BASE}/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush({ data: [USUARIO], error: null, meta: null });

    expect(result).toEqual([USUARIO]);
  });

  it('fetches a single user by id', () => {
    let result: Usuario | undefined;

    service.findById('uid-1').subscribe((usuario) => (result = usuario));

    const req = http.expectOne(`${API_BASE}/users/uid-1`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: USUARIO, error: null, meta: null });

    expect(result).toEqual(USUARIO);
  });

  it('creates via POST /users without a password field (invitation flow)', () => {
    const payload: UsuarioCreatePayload = { nombre: 'Ana', email: 'ana@riff.cl', rol: 'editor' };
    let result: Usuario | undefined;

    service.create(payload).subscribe((usuario) => (result = usuario));

    const req = http.expectOne(`${API_BASE}/users`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    expect(req.request.body).not.toHaveProperty('password');
    req.flush({ data: USUARIO, error: null, meta: null });

    expect(result).toEqual(USUARIO);
  });

  it('updates via PATCH /users/:id (design D4: PATCH, not PUT)', () => {
    let result: Usuario | undefined;

    service.update('uid-1', { nombre: 'Ana R', activo: false }).subscribe((r) => (result = r));

    const req = http.expectOne(`${API_BASE}/users/uid-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ nombre: 'Ana R', activo: false });
    req.flush({ data: { ...USUARIO, nombre: 'Ana R' }, error: null, meta: null });

    expect(result?.nombre).toBe('Ana R');
  });
});
