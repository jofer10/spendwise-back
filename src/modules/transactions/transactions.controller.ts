import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearerAuth')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar transacciones con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista paginada de transacciones' })
  async findAll(
    @Query() query: QueryTransactionDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    return this.transactions.findAll(payload.sub, {
      date_from: query.date_from,
      date_to: query.date_to,
      type: query.type,
      account_id: query.account_id,
      category_id: query.category_id,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción por ID' })
  @ApiResponse({ status: 200, description: 'Transacción encontrada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async findOne(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    return this.transactions.findOne(id, payload.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Crear transacción' })
  @ApiResponse({ status: 201, description: 'Transacción creada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o recurso no encontrado' })
  async create(@Body() dto: CreateTransactionDto, @CurrentUser() payload: JwtPayload) {
    return this.transactions.create(payload.sub, {
      account_id: dto.account_id,
      category_id: dto.category_id,
      payment_method_id: dto.payment_method_id,
      type: dto.type,
      amount: dto.amount,
      transaction_date: dto.transaction_date,
      description: dto.description,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar transacción' })
  @ApiResponse({ status: 200, description: 'Transacción actualizada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    return this.transactions.update(id, payload.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar transacción' })
  @ApiResponse({ status: 204, description: 'Transacción eliminada' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async remove(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    await this.transactions.remove(id, payload.sub);
  }
}
