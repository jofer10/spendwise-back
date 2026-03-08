import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, MinLength, MaxLength } from 'class-validator';

export enum AccountType {
  CASH = 'CASH',
  BANK = 'BANK',
  CARD = 'CARD',
  WALLET = 'WALLET',
}

export class CreateAccountDto {
  @ApiProperty({ example: 'Cuenta principal', description: 'Nombre de la cuenta' })
  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AccountType, example: 'BANK', description: 'Tipo de cuenta' })
  @IsEnum(AccountType, { message: 'Tipo de cuenta inválido' })
  type: AccountType;

  @ApiProperty({ example: 'PEN', description: 'Moneda', default: 'PEN' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ example: 1000.5, description: 'Saldo inicial', default: 0 })
  @IsNumber()
  @IsOptional()
  initial_balance?: number;

  @ApiProperty({ example: false, description: '¿Es la cuenta por defecto?', default: false })
  @IsBoolean()
  @IsOptional()
  is_default?: boolean;
}
