import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Módulo de colas con BullMQ + Redis.
 * Preparado para futuros jobs (emails, reportes, etc.).
 * No se implementan jobs en esta iteración.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('redis.url', 'redis://localhost:6379'),
        },
      }),
      inject: [ConfigService],
    }),
    // Registrar colas aquí cuando se implementen jobs:
    // BullModule.registerQueue({ name: 'email' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
