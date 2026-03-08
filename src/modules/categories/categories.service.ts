import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from './../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.categories.findMany({
      where: { user_id: userId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const category = await this.prisma.categories.findFirst({
      where: { id, user_id: userId },
    });
    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }
    return category;
  }

  async create(userId: string, data: {
    name: string;
    kind: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
  }) {
    const existing = await this.prisma.categories.findFirst({
      where: { user_id: userId, name: data.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    return this.prisma.categories.create({
      data: {
        user_id: userId,
        name: data.name.trim(),
        kind: data.kind as 'INCOME' | 'EXPENSE' | 'BOTH',
        color: data.color?.trim() ?? null,
        icon: data.icon?.trim() ?? null,
        is_active: data.is_active ?? true,
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    kind?: string;
    color?: string;
    icon?: string;
    is_active?: boolean;
  }) {
    await this.findOne(id, userId);

    if (data.name) {
      const existing = await this.prisma.categories.findFirst({
        where: { user_id: userId, name: data.name.trim(), NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.kind !== undefined) updateData.kind = data.kind;
    if (data.color !== undefined) updateData.color = data.color?.trim() || null;
    if (data.icon !== undefined) updateData.icon = data.icon?.trim() || null;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    return this.prisma.categories.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    const hasTransactions = await this.prisma.transactions.count({
      where: { category_id: id },
    });
    if (hasTransactions > 0) {
      throw new ConflictException(
        'No se puede eliminar la categoría porque tiene transacciones asociadas',
      );
    }
    await this.prisma.categories.delete({
      where: { id },
    });
  }
}
