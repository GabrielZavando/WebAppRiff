import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AtributoDto, FichaTecnicaDto, GaleriaItemDto, PrecioDto, StockDto } from './producto-nested.dto';

/**
 * Payload de creación de producto. La unicidad de SKU/slug, la existencia de la
 * categoría y la consistencia categoría/subcategoría son reglas de negocio que
 * valida `ProductoWriteService` (no el DTO). La forma estructural (tipos
 * anidados, campos requeridos) sí se valida aquí.
 */
export class ProductoCreateDto {
  @IsOptional()
  @IsString()
  idExterno?: string | null;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  descripcionBreve?: string;

  @IsOptional()
  @IsString()
  descripcionLarga?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  categoriaId?: string;

  @IsOptional()
  subcategoriaId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AtributoDto)
  atributos?: AtributoDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PrecioDto)
  precio?: PrecioDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StockDto)
  stock?: StockDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GaleriaItemDto)
  galeria?: GaleriaItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FichaTecnicaDto)
  fichaTecnica?: FichaTecnicaDto;

  @IsOptional()
  @IsBoolean()
  destacado?: boolean;

  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}
