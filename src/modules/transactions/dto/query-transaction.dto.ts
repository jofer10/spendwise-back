import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum TxnType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class QueryTransactionDto {
  @ApiProperty({ example: '2025-03-01', description: 'Fecha desde', required: false })
  @IsDateString()
  @IsOptional()
  date_from?: string;

  @ApiProperty({ example: '2025-03-31', description: 'Fecha hasta', required: false })
  @IsDateString()
  @IsOptional()
  date_to?: string;

  @ApiProperty({ enum: TxnType, required: false })
  @IsEnum(TxnType)
  @IsOptional()
  type?: TxnType;

  @ApiProperty({ example: 'uuid', description: 'Filtrar por cuenta', required: false })
  @IsUUID('4')
  @IsOptional()
  account_id?: string;

  @ApiProperty({ example: 'uuid', description: 'Filtrar por categoría', required: false })
  @IsUUID('4')
  @IsOptional()
  category_id?: string;

  @ApiProperty({ example: 1, default: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ example: 20, default: 20, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
