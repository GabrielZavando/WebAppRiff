import { validate } from 'class-validator';
import { UsuarioUpdateDto } from './usuario-update.dto';

describe('UsuarioUpdateDto', () => {
  it('accepts a partial payload (only activo)', async () => {
    const dto = new UsuarioUpdateDto();
    dto.activo = false;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('allows rol=superadmin on update', async () => {
    const dto = new UsuarioUpdateDto();
    dto.rol = 'superadmin';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects an invalid rol value', async () => {
    const dto = new UsuarioUpdateDto();
    (dto as unknown as { rol: string }).rol = 'god';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
