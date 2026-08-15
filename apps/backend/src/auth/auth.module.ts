import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { RolesGuard } from './roles.guard';

/**
 * Módulo compartido de autenticación/autorización. Provee y exporta los guards
 * para que los módulos de dominio (usuarios, categorías, productos, ...) los
 * reutilicen con `@UseGuards(FirebaseAuthGuard, RolesGuard)` + `@Roles(...)`.
 * `Reflector` (usado por `RolesGuard`) es un provider global de Nest.
 */
@Module({
  providers: [FirebaseAuthGuard, RolesGuard],
  exports: [FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
