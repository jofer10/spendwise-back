import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { getPasswordResetEmailHtml } from '../mail/templates/password-reset.template';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';

export interface AuthResponse {
  user: { id: string; email: string; fullName: string };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const user = await this.users.create({
      email: dto.email,
      password: dto.password,
      fullName: dto.fullName,
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await this.users.validatePassword(user, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(userId: string, refreshToken: string): Promise<RefreshResponse> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    let stored: (typeof tokens)[0] | null = null;
    for (const t of tokens) {
      if (t.expiresAt < new Date()) continue;
      try {
        if (await argon2.verify(t.tokenHash, refreshToken)) {
          stored = t;
          break;
        }
      } catch {
        // ignore
      }
    }

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.buildRefreshResponse(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    for (const t of tokens) {
      try {
        if (await argon2.verify(t.tokenHash, refreshToken)) {
          await this.prisma.refreshToken.delete({ where: { id: t.id } });
          return;
        }
      } catch {
        // ignore
      }
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new BadRequestException(
        'No encontramos una cuenta con ese correo. Verifica el email e intenta de nuevo.',
      );
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(rawToken);
    const expiresIn = this.config.get<string>('auth.resetTokenExpiresIn', '1h');
    const expiresAt = this.parseExpiry(expiresIn);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const resetPath = process.env.RESET_PASSWORD_PATH || '/auth/reset-password';
    const resetUrl = `${appUrl.replace(/\/$/, '')}${resetPath}?token=${rawToken}`;
    const expiresInMinutes = expiresIn.includes('h')
      ? parseInt(expiresIn, 10) * 60
      : parseInt(expiresIn, 10);

    await this.mail.send({
      to: user.email,
      subject: 'SpendWise - Restablecer contraseña',
      html: getPasswordResetEmailHtml(user.fullName, resetUrl, expiresInMinutes),
      text: `Hola ${user.fullName}, usa este enlace para restablecer tu contraseña: ${resetUrl}`,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const unusedTokens = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: null },
      include: { user: true },
    });

    for (const t of unusedTokens) {
      if (t.expiresAt < new Date()) continue;
      try {
        if (await argon2.verify(t.tokenHash, token)) {
          const passwordHash = await argon2.hash(newPassword);
          await this.prisma.$transaction([
            this.prisma.user.update({
              where: { id: t.userId },
              data: { passwordHash },
            }),
            this.prisma.passwordResetToken.update({
              where: { id: t.id },
              data: { usedAt: new Date() },
            }),
          ]);
          return;
        }
      } catch {
        // ignore
      }
    }

    const usedTokens = await this.prisma.passwordResetToken.findMany({
      where: { usedAt: { not: null } },
    });

    for (const t of usedTokens) {
      try {
        if (await argon2.verify(t.tokenHash, token)) {
          throw new BadRequestException(
            'Este enlace ya fue utilizado. Por favor inicia sesión.',
          );
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        // ignore argon2 errors
      }
    }

    throw new BadRequestException('Token inválido o expirado');
  }

  async getMe(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      currency: user.currency,
      timezone: user.timezone,
    };
  }

  private async buildAuthResponse(user: User): Promise<AuthResponse> {
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, refreshToken);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      accessToken,
      refreshToken,
    };
  }

  private async buildRefreshResponse(user: User): Promise<RefreshResponse> {
    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.storeRefreshToken(user.id, refreshToken);
    return { accessToken, refreshToken };
  }

  private async generateTokens(user: User) {
    const accessExpires = this.config.get<string>('auth.jwtExpiresIn', '15m');
    const refreshExpires = this.config.get<string>(
      'auth.refreshExpiresIn',
      '7d',
    );

    const jwtSecret = this.config.get<string>('auth.jwtSecret')!;
    const refreshSecret = this.config.get<string>('auth.refreshSecret')!;
    const signOptions = { secret: jwtSecret, expiresIn: accessExpires } as const;
    const refreshSignOptions = { secret: refreshSecret, expiresIn: refreshExpires } as const;
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, email: user.email, type: 'access' },
        signOptions as any,
      ),
      this.jwt.signAsync(
        { sub: user.id, email: user.email, type: 'refresh' },
        refreshSignOptions as any,
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const refreshExpires = this.config.get<string>(
      'auth.refreshExpiresIn',
      '7d',
    );
    const expiresAt = this.parseExpiry(refreshExpires);
    const tokenHash = await argon2.hash(token);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  private parseExpiry(expiry: string): Date {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return new Date(Date.now() + 3600000);

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + value * (multipliers[unit] || 3600000));
  }
}
