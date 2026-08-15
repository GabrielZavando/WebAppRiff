import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class AtributoDto {
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  valor!: string;
}

export class GaleriaItemDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  storagePath!: string;

  @IsString()
  @IsNotEmpty()
  alt!: string;

  @IsNumber()
  orden!: number;
}

export class FichaTecnicaDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  storagePath!: string;

  @IsString()
  @IsNotEmpty()
  nombreArchivo!: string;
}

export class PrecioDto {
  @IsNumber()
  valor!: number;

  @IsBoolean()
  visible!: boolean;
}

export class StockDto {
  @IsBoolean()
  disponible!: boolean;

  @IsOptional()
  @IsInt()
  cantidad?: number | null;
}
