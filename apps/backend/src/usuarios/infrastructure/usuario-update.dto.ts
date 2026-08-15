import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class UsuarioUpdateDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(['superadmin', 'admin', 'editor'])
  rol?: 'superadmin' | 'admin' | 'editor';

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
