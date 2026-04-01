import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnecting = false;

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error('DATABASE_URL topilmadi. .env faylni tekshiring.');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  private async connectWithRetry(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    let attempt = 0;

    while (true) {
      try {
        await this.$connect();
        this.logger.log('Database ulanishi muvaffaqiyatli.');
        break;
      } catch (error) {
        attempt += 1;
        const delay = Math.min(15000, 1000 * attempt);
        const trace =
          error instanceof Error ? error.stack ?? error.message : String(error);
        this.logger.error(
          `Database ulanishida xatolik (urinish ${attempt}). ${Math.ceil(
            delay / 1000,
          )}s dan keyin qayta urinamiz.`,
          trace,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    this.isConnecting = false;
  }

  async onModuleInit(): Promise<void> {
    void this.connectWithRetry();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
    } catch (error) {
      const trace =
        error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error('Database uzishda xatolik yuz berdi.', trace);
    }
  }
}
