import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ICategoriaRepository,
  I_CATEGORIA_REPOSITORY,
} from '../../categorias/domain/icategoria.repository';
import {
  ISubcategoriaIntegrityRepository,
  ISubcategoriaRepository,
  I_SUBCATEGORIA_INTEGRITY_REPOSITORY,
  I_SUBCATEGORIA_REPOSITORY,
  SubcategoriaFilter,
  SubcategoriaInput,
} from '../domain/isubcategoria.repository';
import { Subcategoria } from '../domain/subcategoria.entity';
import { SubcategoriaCreateDto } from '../infrastructure/subcategoria-create.dto';
import { SubcategoriaUpdateDto } from '../infrastructure/subcategoria-update.dto';

@Injectable()
export class SubcategoriaService {
  constructor(
    @Inject(I_SUBCATEGORIA_REPOSITORY)
    private readonly repository: ISubcategoriaRepository,
    @Inject(I_SUBCATEGORIA_INTEGRITY_REPOSITORY)
    private readonly integrity: ISubcategoriaIntegrityRepository,
    @Inject(I_CATEGORIA_REPOSITORY)
    private readonly categoriaRepository: ICategoriaRepository,
  ) {}

  findAll(filter?: SubcategoriaFilter): Promise<Subcategoria[]> {
    return this.repository.findAll(filter);
  }

  async findById(id: string): Promise<Subcategoria> {
    const subcategoria = await this.repository.findById(id);
    if (!subcategoria) {
      throw new NotFoundException('Subcategoria not found');
    }
    return subcategoria;
  }

  async create(dto: SubcategoriaCreateDto): Promise<Subcategoria> {
    const parent = await this.categoriaRepository.findById(dto.categoriaId);
    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }
    const existing = await this.integrity.findByCategoriaAndSlug(dto.categoriaId, dto.slug);
    if (existing) {
      throw new ConflictException('Slug already in use within this category');
    }
    const input: SubcategoriaInput = {
      categoriaId: dto.categoriaId,
      nombre: dto.nombre,
      slug: dto.slug,
      orden: dto.orden ?? 0,
      activa: dto.activa ?? true,
    };
    return this.repository.create(input);
  }

  async update(id: string, dto: SubcategoriaUpdateDto): Promise<Subcategoria> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Subcategoria not found');
    }
    const effectiveCategoriaId = dto.categoriaId ?? current.categoriaId;
    const effectiveSlug = dto.slug ?? current.slug;
    const slugChanged = dto.slug !== undefined && dto.slug !== current.slug;
    const categoryChanged = dto.categoriaId !== undefined && dto.categoriaId !== current.categoriaId;
    if (slugChanged || categoryChanged) {
      await this.assertParentExists(dto.categoriaId, current.categoriaId);
      await this.assertSlugUniqueWithinCategory(id, effectiveCategoriaId, effectiveSlug);
    }
    return this.repository.update(id, dto);
  }

  private async assertParentExists(
    dtoCategoriaId: string | undefined,
    fallbackCategoriaId: string,
  ): Promise<void> {
    if (dtoCategoriaId === undefined || dtoCategoriaId === fallbackCategoriaId) {
      return;
    }
    const parent = await this.categoriaRepository.findById(dtoCategoriaId);
    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }
  }

  private async assertSlugUniqueWithinCategory(
    id: string,
    categoriaId: string,
    slug: string,
  ): Promise<void> {
    const owner = await this.integrity.findByCategoriaAndSlug(categoriaId, slug);
    if (owner && owner.id !== id) {
      throw new ConflictException('Slug already in use within this category');
    }
  }

  async remove(id: string): Promise<void> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Subcategoria not found');
    }
    const hasProducts = await this.integrity.hasAssociatedProducts(id);
    if (hasProducts) {
      throw new ConflictException('Cannot delete a subcategoria with associated products');
    }
    await this.repository.remove(id);
  }
}
