import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UsuarioCreateDto {
  @IsString()
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsEnum(['admin', 'editor'])
  rol!: 'admin' | 'editor';

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
