import { Module } from '@nestjs/common';
import { CarpetsController } from './carpets.controller';
import { CarpetsService } from './carpets.service';

@Module({
  controllers: [CarpetsController],
  providers: [CarpetsService],
  exports: [CarpetsService],
})
export class CarpetsModule {}
