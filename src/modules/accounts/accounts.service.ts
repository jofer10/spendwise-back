import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from './../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.accounts.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const account = await this.prisma.accounts.findFirst({
      where: { id, user_id: userId },
    });
    if (!account) {
      throw new NotFoundException('Cuenta no encontrada');
    }
    return account;
  }

  async create(userId: string, data: {
    name: string;
    type: string;
    currency?: string;
    initial_balance?: number;
    is_default?: boolean;
  }) {
    const existing = await this.prisma.accounts.findFirst({
      where: { user_id: userId, name: data.name.trim() },
    });
    if (existing) {
      throw new ConflictException('Ya existe una cuenta con ese nombre');
    }

    if (data.is_default) {
      await this.prisma.accounts.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    return this.prisma.accounts.create({
      data: {
        user_id: userId,
        name: data.name.trim(),
        type: data.type as 'CASH' | 'BANK' | 'CARD' | 'WALLET',
        currency: data.currency ?? 'PEN',
        initial_balance: new Decimal(data.initial_balance ?? 0),
        is_default: data.is_default ?? false,
      },
    });
  }

  async update(id: string, userId: string, data: {
    name?: string;
    type?: string;
    currency?: string;
    initial_balance?: number;
    is_default?: boolean;
  }) {
    await this.findOne(id, userId);

    if (data.name) {
      const existing = await this.prisma.accounts.findFirst({
        where: { user_id: userId, name: data.name.trim(), NOT: { id } },
      });
      if (existing) {
        throw new ConflictException('Ya existe una cuenta con ese nombre');
      }
    }

    if (data.is_default) {
      await this.prisma.accounts.updateMany({
        where: { user_id: userId },
        data: { is_default: false },
      });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.initial_balance !== undefined) updateData.initial_balance = new Decimal(data.initial_balance);
    if (data.is_default !== undefined) updateData.is_default = data.is_default;

    return this.prisma.accounts.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    const hasTransactions = await this.prisma.transactions.count({
      where: { account_id: id },
    });
    if (hasTransactions > 0) {
      throw new ConflictException(
        'No se puede eliminar la cuenta porque tiene transacciones asociadas',
      );
    }
    await this.prisma.accounts.delete({
      where: { id },
    });
  }
}
