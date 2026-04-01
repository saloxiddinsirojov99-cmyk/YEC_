import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { PrismaService } from './prisma/prisma.service';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  getApiRoot() {
    return {
      message: 'YEC Market API ishlayapti.',
      docs: '/docs',
    };
  }

  @Public()
  @Get('health')
  health() {
    return {
      ok: true,
      time: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        db: true,
        time: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        ok: false,
        db: false,
        time: new Date().toISOString(),
      });
    }
  }

  @Public()
  @Get('api/v1')
  getApiRootWithPrefix() {
    return {
      message: 'YEC Market API ishlayapti.',
      docs: '/docs',
    };
  }
}
