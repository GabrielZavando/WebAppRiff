import { describe, expect, it } from 'vitest';

import {
  Usuario,
  UsuarioCreatePayload,
  UsuarioEstado,
  UsuarioUpdatePayload,
} from './models';

/**
 * Type mirrors of the backend usuarios entities (task 4.1 / design D3, D8).
 * Same deliberate per-workspace duplication as `features/catalog/models`:
 * these tests pin the wire shapes the UI relies on, so a backend drift breaks
 * here first. `UsuarioRol` is reused from `features/auth/auth.models.ts`.
 */
describe('users models (task 4.1)', () => {
  it('builds a usuario with the derived estado and the backend field set', () => {
    const estado: UsuarioEstado = 'invitado';
    const usuario: Usuario = {
      id: 'uid-1',
      nombre: 'Ana',
      email: 'ana@riff.cl',
      rol: 'editor',
      activo: true,
      estado,
      creadoPor: 'system',
      creadoEn: '2026-10-16T10:00:00Z',
      actualizadoEn: '2026-10-16T10:00:00Z',
    };

    expect(Object.keys(usuario).sort()).toEqual(
      [
        'actualizadoEn',
        'activo',
        'creadoEn',
        'creadoPor',
        'email',
        'estado',
        'id',
        'nombre',
        'rol',
      ].sort(),
    );
    expect(usuario.estado).toBe('invitado');
  });

  it('builds the create payload without any password field (invitation flow)', () => {
    const payload: UsuarioCreatePayload = {
      nombre: 'Ana',
      email: 'ana@riff.cl',
      rol: 'editor',
    };

    expect(payload.rol).toBe('editor');
    expect(payload).not.toHaveProperty('password');
  });

  it('builds a partial update payload (nombre, rol, activo)', () => {
    const payload: UsuarioUpdatePayload = { nombre: 'Ana R', rol: 'admin', activo: false };

    expect(payload.nombre).toBe('Ana R');
    expect(payload.rol).toBe('admin');
    expect(payload.activo).toBe(false);
  });
});
