import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FirebaseModule } from '../infrastructure/firebase/firebase.module';
import { CotizacionController } from './infrastructure/cotizacion.controller';
import { CotizacionService } from './application/cotizacion.service';
import { CotizacionRepository } from './infrastructure/cotizacion.repository';
import { I_COTIZACION_REPOSITORY } from './domain/icotizacion.repository';

@Module({
  imports: [AuthModule, FirebaseModule],
  controllers: [CotizacionController],
  providers: [
    CotizacionService,
    { provide: I_COTIZACION_REPOSITORY, useClass: CotizacionRepository },
  ],
  exports: [CotizacionService],
})
export class CotizacionesModule {}
