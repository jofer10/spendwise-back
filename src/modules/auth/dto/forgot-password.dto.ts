import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email del usuario',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}
