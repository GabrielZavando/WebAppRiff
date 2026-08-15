import { ValidationPipeOptions } from '@nestjs/common';

/**
 * Opciones del `ValidationPipe` global del BFF.
 *
 * `whitelist` descarta propiedades no declaradas en el DTO; `transform` convierte
 * el payload al tipo del DTO (p. ej. strings a números); `forbidNonWhitelisted`
 * rechaza explícitamente payloads con campos desconocidos en lugar de ignorarlos.
 */
export function buildValidationOptions(): ValidationPipeOptions {
  return {
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  };
}
