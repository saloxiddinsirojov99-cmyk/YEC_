import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderCronService } from './order-cron.service';
import { MailModule } from '../mail/mail.module';
import { TelegramModule } from '../telegram/telegram.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MailModule, TelegramModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderCronService],
})
export class OrdersModule {}
