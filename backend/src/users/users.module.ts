import { Module } from '@nestjs/common';
import { DefaultSuperAdminService } from './default-superadmin.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, DefaultSuperAdminService],
  exports: [UsersService],
})
export class UsersModule {}
