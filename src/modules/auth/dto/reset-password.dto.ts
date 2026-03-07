import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123token',
    description: 'Token de reset recibido por email',
  })
  @IsString()
  @IsNotEmpty({ message: 'El token es requerido' })
  token: string;

  @ApiProperty({
    example: 'NewSecureP@ss123',
    description: 'Nueva contraseña',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número',
  })
  newPassword: string;
}
