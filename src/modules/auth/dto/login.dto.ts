import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    example: 'SecureP@ss123',
    description: 'Contraseña',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'La contraseña es requerida' })
  password: string;
}
