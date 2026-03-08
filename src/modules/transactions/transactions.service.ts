import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAccountBelongsToUser(accountId: string, userId: string) {
    const account = await this.prisma.accounts.findFirst({
      where: { id: accountId, user_id: userId },
    });
    if (!account) {
      throw new BadRequestException('Cuenta no encontrada o no pertenece al usuario');
    }
  }

  private async assertCategoryBelongsToUser(categoryId: string, userId: string) {
    const category = await this.prisma.categories.findFirst({
      where: { id: categoryId, user_id: userId },
    });
    if (!category) {
      throw new BadRequestException('Categoría no encontrada o no pertenece al usuario');
    }
  }

  private async assertPaymentMethodBelongsToUser(paymentMethodId: string | undefined, userId: string) {
    if (!paymentMethodId) return;
    const pm = await this.prisma.payment_methods.findFirst({
      where: { id: paymentMethodId, user_id: userId },
    });
    if (!pm) {
      throw new BadRequestException('Método de pago no encontrado o no pertenece al usuario');
    }
  }

  async findAll(
    userId: string,
    query: {
      date_from?: string;
      date_to?: string;
      type?: string;
      account_id?: string;
      category_id?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { user_id: userId };

    if (query.date_from || query.date_to) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (query.date_from) dateFilter.gte = new Date(query.date_from);
      if (query.date_to) {
        const to = new Date(query.date_to);
        to.setHours(23, 59, 59, 999);
        dateFilter.lte = to;
      }
      where.transaction_date = dateFilter;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.account_id) {
      where.account_id = query.account_id;
    }
    if (query.category_id) {
      where.category_id = query.category_id;
    }

    const [items, total] = await Promise.all([
      this.prisma.transactions.findMany({
        where,
        include: {
          accounts: { select: { id: true, name: true, type: true } },
          categories: { select: { id: true, name: true, kind: true } },
          payment_methods: { select: { id: true, name: true } },
        },
        orderBy: { transaction_date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transactions.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const txn = await this.prisma.transactions.findFirst({
      where: { id, user_id: userId },
      include: {
        accounts: { select: { id: true, name: true, type: true } },
        categories: { select: { id: true, name: true, kind: true } },
        payment_methods: { select: { id: true, name: true } },
      },
    });
    if (!txn) {
      throw new NotFoundException('Transacción no encontrada');
    }
    return txn;
  }

  async create(userId: string, data: {
    account_id: string;
    category_id: string;
    payment_method_id?: string;
    type: string;
    amount: number;
    transaction_date: string;
    description?: string;
  }) {
    await this.assertAccountBelongsToUser(data.account_id, userId);
    await this.assertCategoryBelongsToUser(data.category_id, userId);
    await this.assertPaymentMethodBelongsToUser(data.payment_method_id, userId);

    return this.prisma.transactions.create({
      data: {
        user_id: userId,
        account_id: data.account_id,
        category_id: data.category_id,
        payment_method_id: data.payment_method_id ?? null,
        type: data.type as 'INCOME' | 'EXPENSE',
        amount: new Decimal(data.amount),
        description: data.description?.trim() ?? null,
        transaction_date: new Date(data.transaction_date),
      },
      include: {
        accounts: { select: { id: true, name: true, type: true } },
        categories: { select: { id: true, name: true, kind: true } },
        payment_methods: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, userId: string, data: {
    account_id?: string;
    category_id?: string;
    payment_method_id?: string;
    type?: string;
    amount?: number;
    transaction_date?: string;
    description?: string;
  }) {
    await this.findOne(id, userId);

    if (data.account_id) await this.assertAccountBelongsToUser(data.account_id, userId);
    if (data.category_id) await this.assertCategoryBelongsToUser(data.category_id, userId);
    if (data.payment_method_id !== undefined) {
      await this.assertPaymentMethodBelongsToUser(data.payment_method_id ?? undefined, userId);
    }

    const updateData: Record<string, unknown> = {};
    if (data.account_id !== undefined) updateData.account_id = data.account_id;
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.payment_method_id !== undefined) updateData.payment_method_id = data.payment_method_id ?? null;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
    if (data.transaction_date !== undefined) updateData.transaction_date = new Date(data.transaction_date);
    if (data.description !== undefined) updateData.description = data.description?.trim() ?? null;

    return this.prisma.transactions.update({
      where: { id },
      data: updateData,
      include: {
        accounts: { select: { id: true, name: true, type: true } },
        categories: { select: { id: true, name: true, kind: true } },
        payment_methods: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.transactions.delete({
      where: { id },
    });
  }
}
