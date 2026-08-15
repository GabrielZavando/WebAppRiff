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
