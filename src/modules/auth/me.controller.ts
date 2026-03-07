import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller()
export class MeController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiResponse({
    status: 200,
    description: 'Usuario actual',
    schema: {
      example: {
        id: 'uuid',
        email: 'user@example.com',
        fullName: 'Juan Pérez',
        currency: 'USD',
        timezone: 'UTC',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async me(@CurrentUser() payload: JwtPayload) {
    return this.auth.getMe(payload.sub);
  }
}
