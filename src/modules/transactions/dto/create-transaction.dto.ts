import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsNumber, IsUUID, IsDateString, Min, MaxLength } from 'class-validator';

export enum TxnType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid', description: 'ID de la cuenta' })
  @IsUUID('4', { message: 'ID de cuenta inválido' })
  account_id: string;

  @ApiProperty({ example: 'uuid', description: 'ID de la categoría' })
  @IsUUID('4', { message: 'ID de categoría inválido' })
  category_id: string;

  @ApiProperty({ example: 'uuid', description: 'ID del método de pago', required: false })
  @IsUUID('4', { message: 'ID de método de pago inválido' })
  @IsOptional()
  payment_method_id?: string;

  @ApiProperty({ enum: TxnType, example: 'EXPENSE', description: 'Tipo de transacción' })
  @IsEnum(TxnType, { message: 'Tipo de transacción inválido' })
  type: TxnType;

  @ApiProperty({ example: 150.5, description: 'Monto (siempre positivo)' })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiProperty({ example: '2025-03-02', description: 'Fecha de la transacción' })
  @IsDateString({}, { message: 'Fecha inválida' })
  transaction_date: string;

  @ApiProperty({ example: 'Compra en supermercado', description: 'Descripción', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
