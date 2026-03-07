import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as argon2 from 'argon2';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    email: string;
    password: string;
    fullName: string;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email ya registrado');
    }

    const passwordHash = await argon2.hash(data.password);

    return this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        fullName: data.fullName.trim(),
      },
    });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return argon2.verify(user.passwordHash, password);
  }
}
