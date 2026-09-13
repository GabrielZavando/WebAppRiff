import { Cotizacion, CotizacionInput, CotizacionFilter } from './cotizacion.entity';

describe('Cotizacion entity', () => {
  it('Cotizacion type compiles with all required fields', () => {
    const entity: Cotizacion = {
      id: 'c1',
      nombre: 'Juan',
      email: 'juan@example.com',
      telefono: '+56912345678',
      nombre_empresa: 'Riff SpA',
      rut: '12345678-9',
      mensaje: 'Solicito cotización',
      estado: 'pendiente',
      creadoEn: new Date(),
      actualizadoEn: new Date(),
    };
    expect(entity.id).toBe('c1');
    expect(entity.estado).toBe('pendiente');
  });

  it('CotizacionInput type compiles without id, estado, or timestamps', () => {
    const input: CotizacionInput = {
      nombre: 'Juan',
      email: 'juan@example.com',
      nombre_empresa: 'Riff SpA',
      mensaje: 'Solicito cotización',
    };
    expect(input.nombre).toBe('Juan');
  });

  it('CotizacionInput accepts nullable telefono and rut', () => {
    const input: CotizacionInput = {
      nombre: 'Juan',
      email: 'juan@example.com',
      telefono: null,
      nombre_empresa: 'Riff SpA',
      rut: null,
      mensaje: 'Solicito cotización',
    };
    expect(input.telefono).toBeNull();
    expect(input.rut).toBeNull();
  });

  it('CotizacionFilter type compiles with optional fields', () => {
    const filter: CotizacionFilter = {};
    expect(filter.estado).toBeUndefined();
    expect(filter.page).toBeUndefined();
    expect(filter.limit).toBeUndefined();
  });

  it('CotizacionFilter accepts valid estado values', () => {
    const pending: CotizacionFilter = { estado: 'pendiente' };
    const attended: CotizacionFilter = { estado: 'atendida' };
    expect(pending.estado).toBe('pendiente');
    expect(attended.estado).toBe('atendida');
  });
});
