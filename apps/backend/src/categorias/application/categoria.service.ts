import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CategoriaFilter,
  CategoriaInput,
  ICategoriaIntegrityRepository,
  ICategoriaRepository,
  I_CATEGORIA_INTEGRITY_REPOSITORY,
  I_CATEGORIA_REPOSITORY,
} from '../domain/icategoria.repository';
import { Categoria } from '../domain/categoria.entity';
import { CategoriaCreateDto } from '../infrastructure/categoria-create.dto';
import { CategoriaUpdateDto } from '../infrastructure/categoria-update.dto';
import { slugify } from '@/common/utils/slugify';

@Injectable()
export class CategoriaService {
  constructor(
    @Inject(I_CATEGORIA_REPOSITORY) private readonly repository: ICategoriaRepository,
    @Inject(I_CATEGORIA_INTEGRITY_REPOSITORY)
    private readonly integrity: ICategoriaIntegrityRepository,
  ) {}

  findAll(filter?: CategoriaFilter): Promise<Categoria[]> {
    return this.repository.findAll(filter);
  }

  async findById(id: string): Promise<Categoria> {
    const categoria = await this.repository.findById(id);
    if (!categoria) {
      throw new NotFoundException('Category not found');
    }
    return categoria;
  }

  async create(dto: CategoriaCreateDto): Promise<Categoria> {
    const slug = dto.slug ?? slugify(dto.nombre);
    const existing = await this.integrity.findBySlug(slug);
    if (existing) {
      throw new ConflictException('Slug already in use');
    }
    const input: CategoriaInput = {
      nombre: dto.nombre,
      slug,
      orden: dto.orden ?? 0,
      activa: dto.activa ?? true,
    };
    return this.repository.create(input);
  }

  async update(id: string, dto: CategoriaUpdateDto): Promise<Categoria> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Category not found');
    }
    if (dto.slug && dto.slug !== current.slug) {
      const slugOwner = await this.integrity.findBySlug(dto.slug);
      if (slugOwner && slugOwner.id !== id) {
        throw new ConflictException('Slug already in use');
      }
    }
    return this.repository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new NotFoundException('Category not found');
    }
    if (current.esDefault) {
      throw new ConflictException('Cannot delete the default category');
    }
    const hasProducts = await this.integrity.hasAssociatedProducts(id);
    if (hasProducts) {
      throw new ConflictException('Cannot delete a category with associated products');
    }
    await this.repository.remove(id);
  }

  ensureDefault(): Promise<void> {
    return this.integrity.ensureDefault();
  }
}
