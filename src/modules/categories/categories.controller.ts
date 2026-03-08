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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('bearerAuth')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de categorías' })
  async findAll(@CurrentUser() payload: JwtPayload) {
    return this.categories.findAll(payload.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una categoría por ID' })
  @ApiResponse({ status: 200, description: 'Categoría encontrada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  async findOne(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    return this.categories.findOne(id, payload.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Crear categoría' })
  @ApiResponse({ status: 201, description: 'Categoría creada' })
  @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() payload: JwtPayload) {
    return this.categories.create(payload.sub, {
      name: dto.name,
      kind: dto.kind,
      color: dto.color,
      icon: dto.icon,
      is_active: dto.is_active,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() payload: JwtPayload,
  ) {
    return this.categories.update(id, payload.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  @ApiResponse({ status: 204, description: 'Categoría eliminada' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  @ApiResponse({ status: 409, description: 'Tiene transacciones asociadas' })
  async remove(@Param('id') id: string, @CurrentUser() payload: JwtPayload) {
    await this.categories.remove(id, payload.sub);
  }
}
