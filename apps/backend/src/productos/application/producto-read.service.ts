import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProductQueryRepository, I_PRODUCT_QUERY_REPOSITORY } from '../domain/iproducto.repository';
import { Producto, ProductoFilter } from '../domain/producto.entity';

/**
 * Casos de uso de lectura de productos. Fuerza `publicado: true` para
 * solicitantes anónimos (el catálogo público solo expone publicados); un
 * usuario autenticado (cualquier rol) puede ver también no publicados.
 */
@Injectable()
export class ProductoReadService {
  constructor(
    @Inject(I_PRODUCT_QUERY_REPOSITORY)
    private readonly queryRepository: IProductQueryRepository,
  ) {}

  async findAll(filter: ProductoFilter, isAuthenticated: boolean): Promise<Producto[]> {
    const effectiveFilter: ProductoFilter = { ...filter };
    if (!isAuthenticated) {
      effectiveFilter.publicado = true;
    }
    return this.queryRepository.findAll(effectiveFilter);
  }

  async findById(id: string, isAuthenticated: boolean): Promise<Producto> {
    const producto = await this.queryRepository.findById(id);
    if (!producto) {
      throw new NotFoundException('Producto not found');
    }
    if (!isAuthenticated && !producto.publicado) {
      throw new NotFoundException('Producto not found');
    }
    return producto;
  }

  async findBySlug(slug: string, isAuthenticated: boolean): Promise<Producto> {
    const producto = await this.queryRepository.findBySlug(slug);
    if (!producto) {
      throw new NotFoundException('Producto not found');
    }
    if (!isAuthenticated && !producto.publicado) {
      throw new NotFoundException('Producto not found');
    }
    return producto;
  }
}
