import { Injectable, Inject } from '@nestjs/common';
import {
  ISubcategoriaRepository,
  I_SUBCATEGORIA_REPOSITORY,
} from '@/subcategorias/domain/isubcategoria.repository';

export const MEDIDORES_DE_NIVEL_ID = 'medicion-de-fluidos--medidores-de-nivel';

/**
 * Paso previo idempotente del seed de productos: asegura que exista la
 * subcategoría `Medidores de Nivel` (requerida para publicar `prod-014` en el
 * futuro). Vive como provider aislado con 1 dependencia para no romper el
 * límite de 3 del `SeedProductosUseCase` y preservar SRP.
 */
@Injectable()
export class EnsureSeedSubcategorias {
  constructor(
    @Inject(I_SUBCATEGORIA_REPOSITORY)
    private readonly subcategoriaRepository: ISubcategoriaRepository,
  ) {}

  async ensureMedidoresDeNivel(): Promise<void> {
    const existing = await this.subcategoriaRepository.findById(MEDIDORES_DE_NIVEL_ID);
    if (existing) {
      return;
    }
    await this.subcategoriaRepository.create({
      id: MEDIDORES_DE_NIVEL_ID,
      categoriaId: 'medicion-de-fluidos',
      nombre: 'Medidores de Nivel',
      slug: 'medidores-de-nivel',
      orden: 99,
      activa: true,
    });
  }
}
