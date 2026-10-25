import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MaxVisibleTextLength } from '../../common/validators/max-visible-text-length.decorator';
import { MAX_DESCRIPCION_BREVE, MAX_DESCRIPCION_LARGA } from '../domain/producto-description-limits';
import { AtributoDto, FichaTecnicaDto, GaleriaItemDto, PrecioDto, StockDto } from './producto-nested.dto';

/**
 * Payload de actualización de producto. Todos los campos son opcionales
 * (actualización parcial). La unicidad de SKU/slug y la consistencia
 * categoría/subcategoría se validan en `ProductoWriteService`, excluyendo el
 * propio producto en las comprobaciones de unicidad.
 */
export class ProductoUpdateDto {
  @IsOptional()
  @IsString()
  idExterno?: string | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sku?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_DESCRIPCION_BREVE)
  descripcionBreve?: string;

  @IsOptional()
  @IsString()
  @MaxVisibleTextLength(MAX_DESCRIPCION_LARGA)
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
