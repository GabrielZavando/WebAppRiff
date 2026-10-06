import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './infrastructure/firebase/firebase.module';
import { FirestoreModule } from './infrastructure/firebase/firestore.module';
import { CommonModule } from './common/common.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CategoriasModule } from './categorias/categorias.module';
import { SubcategoriasModule } from './subcategorias/subcategorias.module';
import { ProductosModule } from './productos/productos.module';
import { CotizacionesModule } from './cotizaciones/cotizaciones.module';
import { EmailModule } from './email/email.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FirebaseModule,
    FirestoreModule,
    CommonModule,
    UsuariosModule,
    CategoriasModule,
    SubcategoriasModule,
    ProductosModule,
    CotizacionesModule,
    EmailModule,
    ContactsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
