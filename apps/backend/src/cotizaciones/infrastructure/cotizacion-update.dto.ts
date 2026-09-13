import { IsIn, IsNotEmpty } from 'class-validator';

export class CotizacionUpdateDto {
  @IsNotEmpty()
  @IsIn(['pendiente', 'atendida'])
  estado!: 'pendiente' | 'atendida';
}
