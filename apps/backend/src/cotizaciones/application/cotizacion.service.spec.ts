import { NotFoundException } from '@nestjs/common';
import { CotizacionService } from './cotizacion.service';
import {
  ICotizacionRepository,
  I_COTIZACION_REPOSITORY,
} from '../domain/icotizacion.repository';
import { Cotizacion } from '../domain/cotizacion.entity';

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

describe('CotizacionService', () => {
  let service: CotizacionService;
  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    updateEstado: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      updateEstado: jest.fn(),
    };
    service = new CotizacionService(
      repository as unknown as ICotizacionRepository,
    );
  });

  describe('create', () => {
    it('delegates to repository and returns the created cotizacion', async () => {
      const cotizacion = makeCotizacion();
      repository.create.mockResolvedValue(cotizacion);
      const result = await service.create({
        nombre: 'Juan',
        email: 'juan@example.com',
        nombre_empresa: 'Riff SpA',
        mensaje: 'Solicito cotización',
      });
      expect(repository.create).toHaveBeenCalledWith({
        nombre: 'Juan',
        email: 'juan@example.com',
        nombre_empresa: 'Riff SpA',
        mensaje: 'Solicito cotización',
      });
      expect(result.id).toBe('c1');
    });
  });

  describe('findAll', () => {
    it('delegates to repository with the filter and returns paginated result with meta', async () => {
      const data = [makeCotizacion()];
      repository.findAll.mockResolvedValue({ data, total: 1 });
      const result = await service.findAll({ estado: 'pendiente', page: 1, limit: 10 });
      expect(repository.findAll).toHaveBeenCalledWith({ estado: 'pendiente', page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1 });
    });

    it('delegates with empty filter', async () => {
      repository.findAll.mockResolvedValue({ data: [], total: 0 });
      await service.findAll({});
      expect(repository.findAll).toHaveBeenCalledWith({});
    });

    it('applies default pagination when page/limit omitted', async () => {
      repository.findAll.mockResolvedValue({ data: [], total: 0 });
      const result = await service.findAll({});
      expect(result.meta).toEqual({ page: 1, limit: 20, total: 0 });
    });
  });

  describe('findById', () => {
    it('returns the cotizacion when it exists', async () => {
      repository.findById.mockResolvedValue(makeCotizacion());
      const result = await service.findById('c1');
      expect(result.id).toBe('c1');
    });

    it('throws NotFoundException when missing', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateEstado', () => {
    it('throws NotFoundException when the cotizacion does not exist', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.updateEstado('missing', 'atendida')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('delegates to repository when the cotizacion exists', async () => {
      repository.findById.mockResolvedValue(makeCotizacion());
      repository.updateEstado.mockResolvedValue(makeCotizacion({ estado: 'atendida' }));
      const result = await service.updateEstado('c1', 'atendida');
      expect(repository.updateEstado).toHaveBeenCalledWith('c1', 'atendida');
      expect(result.estado).toBe('atendida');
    });
  });
});
