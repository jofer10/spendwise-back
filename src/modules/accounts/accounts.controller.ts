import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearerAuth')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cuentas del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas' })
  async findAll(@CurrentUser() payload: JwtPayload) {
    return this.accounts.findAll(payload.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuenta por ID' })
  @ApiResponse({ status: 200, description: 'Cuenta encontrada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async findOne(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    return this.accounts.findOne(id, payload.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Crear cuenta' })
  @ApiResponse({ status: 201, description: 'Cuenta creada' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta con ese nombre' })
  async create(@Body() dto: CreateAccountDto, @CurrentUser() payload: JwtPayload) {
    return this.accounts.create(payload.sub, {
      name: dto.name,
      type: dto.type,
      currency: dto.currency,
      initial_balance: dto.initial_balance,
      is_default: dto.is_default,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cuenta' })
  @ApiResponse({ status: 200, description: 'Cuenta actualizada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe una cuenta con ese nombre' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    return this.accounts.update(id, payload.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cuenta' })
  @ApiResponse({ status: 204, description: 'Cuenta eliminada' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async remove(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    await this.accounts.remove(id, payload.sub);
  }
}
