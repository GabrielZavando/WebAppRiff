import { validate } from 'class-validator';
import { UsuarioCreateDto } from './usuario-create.dto';

describe('UsuarioCreateDto', () => {
  it('rejects rol outside [admin, editor]', async () => {
    const dto = new UsuarioCreateDto();
    dto.nombre = 'Ana';
    dto.email = 'ana@riff.cl';
    (dto as unknown as { rol: string }).rol = 'superadmin';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts a valid editor payload', async () => {
    const dto = new UsuarioCreateDto();
    dto.nombre = 'Ana';
    dto.email = 'ana@riff.cl';
    dto.rol = 'editor';
    dto.password = 'secret1';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects a malformed email', async () => {
    const dto = new UsuarioCreateDto();
    dto.nombre = 'Ana';
    dto.email = 'not-an-email';
    dto.rol = 'editor';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a password shorter than 6 chars', async () => {
    const dto = new UsuarioCreateDto();
    dto.nombre = 'Ana';
    dto.email = 'ana@riff.cl';
    dto.rol = 'editor';
    dto.password = '123';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
