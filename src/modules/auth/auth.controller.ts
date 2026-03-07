import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, AuthResponse, RefreshResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado correctamente',
    schema: {
      example: {
        user: { id: 'uuid', email: 'user@example.com', fullName: 'Juan Pérez' },
        accessToken: 'eyJhbGciOiJIUzI1NiIs...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIs...',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  @ApiResponse({ status: 422, description: 'Datos de validación inválidos' })
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.auth.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refrescar tokens' })
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @CurrentUser() payload: JwtPayload & { refreshToken: string },
    @Body() dto: RefreshDto,
  ): Promise<RefreshResponse> {
    return this.auth.refresh(payload.sub, dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Cerrar sesión (revocar refresh token)' })
  @ApiResponse({ status: 204, description: 'Sesión cerrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiBody({
    schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] },
  })
  async logout(
    @CurrentUser() payload: JwtPayload,
    @Body('refreshToken') refreshToken: string,
  ): Promise<void> {
    await this.auth.logout(payload.sub, refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar reset de contraseña por email' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 202, description: 'Solicitud aceptada. Revisa tu correo para el enlace de restablecimiento.' })
  @ApiResponse({
    status: 400,
    description: 'Email no registrado',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'No encontramos una cuenta con ese correo. Verifica el email e intenta de nuevo.',
      },
    },
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({
    status: 400,
    description: 'Token inválido, expirado o ya utilizado',
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Token inválido o expirado',
      },
    },
  })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.newPassword);
  }
}
