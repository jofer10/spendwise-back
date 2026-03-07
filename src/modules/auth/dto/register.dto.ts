import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    example: 'SecureP@ss123',
    description: 'Contraseña (mín 8 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo',
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100)
  fullName: string;
}
