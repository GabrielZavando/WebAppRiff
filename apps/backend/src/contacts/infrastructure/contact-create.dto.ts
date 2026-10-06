import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * Public payload for `POST /api/v1/contacts`. Mirrors the fields rendered by
 * `ContactForm.astro` (nombre, empresa, email, telefono, areasDeInteres[],
 * mensaje) plus the anti-spam honeypot `website`.
 *
 * `website` is `@IsOptional()` so older frontends deployed before this change
 * keep working (forbidNonWhitelisted requires the field to be declared, but a
 * missing/empty honeypot must never fail validation).
 */
export class ContactCreateDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsNotEmpty()
  @IsString()
  empresa!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  telefono!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasDeInteres?: string[];

  @IsNotEmpty()
  @IsString()
  mensaje!: string;

  @IsOptional()
  @IsString()
  website?: string;
}