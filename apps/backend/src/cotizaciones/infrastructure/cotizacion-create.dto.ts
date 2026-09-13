import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CotizacionCreateDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsNotEmpty()
  @IsString()
  nombre_empresa!: string;

  @IsOptional()
  @IsString()
  rut?: string;

  @IsNotEmpty()
  @IsString()
  mensaje!: string;
}
