import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './modules/mail/mail.module';
import { HealthModule } from './modules/health/health.module';
import { QueueModule } from './modules/queue/queue.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    MailModule,
    AuthModule,
    HealthModule,
    QueueModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
