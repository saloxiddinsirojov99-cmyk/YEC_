import { Module } from '@nestjs/common';
import { PushNotificationService } from './push-notification.service';
import { NotificationsController } from './notifications.controller';

@Module({
  providers: [PushNotificationService],
  controllers: [NotificationsController],
  exports: [PushNotificationService],
})
export class NotificationsModule {}
