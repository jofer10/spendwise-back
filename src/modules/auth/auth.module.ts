import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { MeController } from './me.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) =>
        ({
          secret: config.get<string>('auth.jwtSecret'),
          signOptions: { expiresIn: config.get<string>('auth.jwtExpiresIn', '15m') },
        } as any),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, MeController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
