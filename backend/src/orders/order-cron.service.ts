import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../notifications/push-notification.service';

@Injectable()
export class OrderCronService {
  private readonly logger = new Logger(OrderCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
  ) {}

  // Har kuni soat 17:00 da ishlaydi
  @Cron('0 0 17 * * *')
  async handleDeliveryReminder() {
    this.logger.log('Yetkazib berish eslatmalari tekshirilmoqda...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueOrders = await this.prisma.order.findMany({
      where: {
        status: { in: ['ACCEPTED', 'ON_WAY'] },
        deliveryDate: {
          lte: new Date(), // Bugun yoki undan oldingi sanalar
        },
      },
    });

    if (overdueOrders.length > 0) {
      this.logger.warn(`${overdueOrders.length} ta kechikkan buyurtma topildi.`);
      
      await this.pushService.notifyAdmins(
        'Kechikkan buyurtmalar!',
        `${overdueOrders.length} ta buyurtma bugun soat 17:00 gacha yetkazilmadi. Iltimos, mijozlarga tushuntirish xabari yuboring.`,
        '/admin/orders'
      );
    }
  }
}
