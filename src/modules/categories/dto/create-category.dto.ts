import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';

export enum CategoryKind {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  BOTH = 'BOTH',
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Alimentación', description: 'Nombre de la categoría' })
  @IsString()
  @MinLength(1, { message: 'El nombre es requerido' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: CategoryKind, example: 'EXPENSE', description: 'Tipo de categoría' })
  @IsEnum(CategoryKind, { message: 'Tipo de categoría inválido' })
  kind: CategoryKind;

  @ApiProperty({ example: '#FF5733', description: 'Color en hex', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  color?: string;

  @ApiProperty({ example: 'shopping-cart', description: 'Nombre del icono', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  icon?: string;

  @ApiProperty({ example: true, description: '¿Categoría activa?', default: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
