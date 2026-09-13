import { CotizacionController } from './cotizacion.controller';
import { CotizacionService } from '../application/cotizacion.service';
import { Cotizacion } from '../domain/cotizacion.entity';
import { ROLES_KEY } from '../../auth/roles.decorator';

const makeCotizacion = (overrides: Partial<Cotizacion> = {}): Cotizacion => ({
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
  ...overrides,
});

describe('CotizacionController', () => {
  let controller: CotizacionController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    updateEstado: jest.Mock;
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateEstado: jest.fn(),
    };
    controller = new CotizacionController(service as unknown as CotizacionService);
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('delegates to service.create and returns the created cotizacion', async () => {
      const cotizacion = makeCotizacion();
      service.create.mockResolvedValue(cotizacion);
      const dto = {
        nombre: 'Juan',
        email: 'juan@example.com',
        nombre_empresa: 'Riff SpA',
        mensaje: 'Solicito cotización',
      };
      const result = await controller.create(dto as never);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result.id).toBe('c1');
    });
  });

  describe('GET /', () => {
    it('delegates with parsed filter', async () => {
      service.findAll.mockResolvedValue({ data: [makeCotizacion()], total: 1 });
      const result = await controller.findAll('pendiente', '1', '10');
      expect(service.findAll).toHaveBeenCalledWith({ estado: 'pendiente', page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
    });

    it('delegates with empty query params', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0 });
      await controller.findAll(undefined, undefined, undefined);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('ignores invalid estado values', async () => {
      service.findAll.mockResolvedValue({ data: [], total: 0 });
      await controller.findAll('invalid' as never, undefined, undefined);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('GET /:id', () => {
    it('delegates to service.findById', async () => {
      service.findById.mockResolvedValue(makeCotizacion());
      const result = await controller.findById('c1');
      expect(service.findById).toHaveBeenCalledWith('c1');
      expect(result.id).toBe('c1');
    });
  });

  describe('PATCH /:id', () => {
    it('delegates to service.updateEstado', async () => {
      service.updateEstado.mockResolvedValue(makeCotizacion({ estado: 'atendida' }));
      const dto = { estado: 'atendida' as const };
      const result = await controller.updateEstado('c1', dto);
      expect(service.updateEstado).toHaveBeenCalledWith('c1', 'atendida');
      expect(result.estado).toBe('atendida');
    });
  });

  describe('role metadata', () => {
    it('has no @Roles on POST (public endpoint)', () => {
      const roles = Reflect.getMetadata(ROLES_KEY, CotizacionController.prototype.create);
      expect(roles).toBeUndefined();
    });

    it('restricts GET / to superadmin/admin', () => {
      expect(Reflect.getMetadata(ROLES_KEY, CotizacionController.prototype.findAll)).toEqual([
        'superadmin',
        'admin',
      ]);
    });

    it('restricts GET /:id to superadmin/admin', () => {
      expect(Reflect.getMetadata(ROLES_KEY, CotizacionController.prototype.findById)).toEqual([
        'superadmin',
        'admin',
      ]);
    });

    it('allows editor on PATCH /:id', () => {
      expect(Reflect.getMetadata(ROLES_KEY, CotizacionController.prototype.updateEstado)).toEqual([
        'superadmin',
        'admin',
        'editor',
      ]);
    });
  });
});
