import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { PreviewPromoDto } from './dto/preview-promo.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';
import { PushNotificationService } from '../notifications/push-notification.service';
import { formatOrderNumber } from '../common/utils/order-number';

type ResolvedPromoCode = {
  id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  minOrderAmount: number;
  type: 'DISCOUNT' | 'GIFT';
  giftName: string | null;
  giftImage: string | null;
  giftPrice: number | null;
};

type CarpetSnapshot = {
  id: string;
  price: unknown;
  discountPercent: number;
  stock: number;
  name: string;
  categoryId: string;
};

type OrderPricingItem = {
  carpetId: string;
  carpetName: string;
  quantity: number;
  originalUnitPrice: number;
  carpetDiscountPercent: number;
  unitPriceAfterCarpetDiscount: number;
  promoDiscountPercent: number;
  unitPriceAfterPromo: number;
  lineOriginalTotal: number;
  lineAfterCarpetDiscountTotal: number;
  lineTotal: number;
  lineProductDiscountAmount: number;
  linePromoDiscountAmount: number;
  lineTotalDiscountAmount: number;
};

type OrderPricingSummary = {
  items: OrderPricingItem[];
  totalOriginalAmount: number;
  subtotalAfterCarpetDiscount: number;
  totalAfterPromo: number;
  productDiscountAmount: number;
  promoDiscountAmount: number;
  totalDiscountAmount: number;
  totalDiscountPercent: number;
};

@Injectable()
export class OrdersService {
  private readonly orderTransitionMap: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
    ACCEPTED: [OrderStatus.ON_WAY, OrderStatus.CANCELLED],
    ON_WAY: [OrderStatus.DELIVERED],
    DELIVERED: [],
    CANCELLED: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto) {
    const normalizedPromoCode = this.normalizePromoCode(dto.promoCode);

    // Yetkazib berish shartlari admin tomonidan kelishiladi

    try {
      return await this.prisma.$transaction(async (tx) => {
        const carpetMap = await this.loadCarpetMap(tx, dto.items);
        const promoCode = await this.resolvePromoCode(
          tx,
          customerId,
          normalizedPromoCode,
        );
        const pricing = this.buildPricingSummary(dto.items, carpetMap, promoCode);

        if (
          promoCode &&
          promoCode.minOrderAmount > 0 &&
          pricing.subtotalAfterCarpetDiscount < promoCode.minOrderAmount
        ) {
          throw new BadRequestException(
            `Bu promokod ${this.formatCurrency(promoCode.minOrderAmount)}dan oshgan buyurtmalar uchun.`,
          );
        }

        await this.reserveStockAndIncrementSales(tx, dto.items, carpetMap);

        const order = await tx.order.create({
          data: {
            customerId,
            customerName: dto.customerName,
            phone: dto.phone,
            phone2: dto.phone2,
            address: dto.address,
            locationLat: dto.locationLat,
            locationLng: dto.locationLng,
            locationText: dto.locationText,
            paymentMethod: dto.paymentMethod,
            comment: dto.comment,
            appliedPromoCode: promoCode?.code ?? null,
            appliedPromoPercent:
              promoCode && promoCode.type === 'DISCOUNT'
                ? promoCode.discountPercent
                : 0,
            appliedPromoType: promoCode?.type ?? null,
            appliedPromoGiftName:
              promoCode?.type === 'GIFT' ? promoCode.giftName ?? 'Gilamcha' : null,
            appliedPromoGiftImage:
              promoCode?.type === 'GIFT' ? promoCode.giftImage : null,
            appliedPromoGiftPrice:
              promoCode?.type === 'GIFT' ? promoCode.giftPrice : null,
            items: {
              create: pricing.items.map((item) => ({
                carpetId: item.carpetId,
                quantity: item.quantity,
                price: item.unitPriceAfterPromo,
              })),
            },
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
              },
            },
            items: {
              include: {
                carpet: true,
              },
            },
          },
        });

        if (promoCode) {
          await tx.promoCodeUsage.create({
            data: {
              promoCodeId: promoCode.id,
              userId: customerId,
              orderId: order.id,
            },
          });
        }

        // Send notifications (async, don't block)
        const adminEmail = this.configService.get<string>('SMTP_USER') || '';
        if (adminEmail) {
          void this.mailService.sendNewOrderNotification(adminEmail, order, pricing);
        }

        const tgMessage = this.buildTelegramOrderMessage(order, pricing);
        void this.telegramService.notifyAdmins(
          tgMessage,
          order.locationLat && order.locationLng
            ? { lat: Number(order.locationLat), lng: Number(order.locationLng) }
            : undefined,
        );

        void this.pushNotificationService.notifyAdmins(
          'Yangi Buyurtma!',
          `${order.customerName} tomonidan yangi buyurtma qabul qilindi.`,
          `/admin/orders/${order.id}`,
        );

        return order;
      });
    } catch (error) {
      if (this.isPromoCodeReuseError(error)) {
        throw new BadRequestException(
          "Siz bu promokoddan allaqachon foydalangansiz.",
        );
      }
      throw error;
    }
  }

  async previewPromo(customerId: string, dto: PreviewPromoDto) {
    const normalizedPromoCode = this.normalizePromoCode(dto.promoCode);
    const carpetMap = await this.loadCarpetMap(this.prisma, dto.items);
    const pricingWithoutPromo = this.buildPricingSummary(dto.items, carpetMap, null);

    if (!normalizedPromoCode) {
      return {
        state: 'empty',
        message: 'Promokod kiritilmagan.',
        promo: null,
        pricing: pricingWithoutPromo,
      };
    }

    try {
      const promoCode = await this.resolvePromoCode(
        this.prisma,
        customerId,
        normalizedPromoCode,
      );
      const pricing = this.buildPricingSummary(dto.items, carpetMap, promoCode);

      if (
        promoCode &&
        promoCode.minOrderAmount > 0 &&
        pricing.subtotalAfterCarpetDiscount < promoCode.minOrderAmount
      ) {
        throw new BadRequestException(
          `Bu promokod ${this.formatCurrency(promoCode.minOrderAmount)}dan oshgan buyurtmalar uchun.`,
        );
      }

      return {
        state: 'valid',
        message:
          promoCode?.type === 'GIFT'
            ? `Promokod qabul qilindi. Sovg'a: ${promoCode.giftName ?? 'Gilamcha'}.`
            : `Promokod qabul qilindi. Qo'shimcha skidka: -${promoCode?.discountPercent ?? 0}%.`,
        promo: promoCode
          ? {
              code: promoCode.code,
              type: promoCode.type,
              discountPercent: promoCode.discountPercent,
              minOrderAmount: promoCode.minOrderAmount,
              giftName: promoCode.giftName,
              giftImage: promoCode.giftImage,
              giftPrice: promoCode.giftPrice,
            }
          : null,
        pricing,
      };
    } catch (error) {
      const message =
        error instanceof BadRequestException
          ? this.extractBadRequestMessage(error)
          : 'Promokodni tekshirib bo\'lmadi.';

      return {
        state: 'invalid',
        message,
        promo: {
          code: normalizedPromoCode,
        },
        pricing: pricingWithoutPromo,
      };
    }
  }

  async findMy(customerId: string, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = {
      customerId,
      status: query.status,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          items: {
            include: {
              carpet: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private formatPhoneNumber(value: string): string {
    const digits = (value || '').replace(/\D/g, '');
    let localDigits = '';
    if (digits.startsWith('998')) {
      localDigits = digits.slice(3, 12);
    } else {
      localDigits = digits.slice(0, 9);
    }

    const compact = localDigits.padEnd(9, '');
    return `+998${compact}`;
  }

  async findAll(query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = { status: query.status };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
          items: {
            include: {
              carpet: {
                include: { category: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, role: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
        items: {
          include: {
            carpet: { include: { category: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    if (
      role !== 'ADMIN' &&
      role !== 'SUPERADMIN' &&
      order.customerId !== userId
    ) {
      throw new BadRequestException(
        "Siz faqatgina o'zingizning buyurtmangizni ko'ra olasiz.",
      );
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, role: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        "Yakunlangan buyurtma holatini o'zgartirib bo'lmaydi.",
      );
    }

    if (dto.status === OrderStatus.PENDING) {
      throw new BadRequestException(
        "Buyurtma holatini 'Kutilmoqda' (PENDING) ga qaytarib bo'lmaydi.",
      );
    }

    const nextStatus = dto.status ?? order.status;
    if (
      dto.status &&
      dto.status !== order.status &&
      !this.canTransition(order.status, dto.status)
    ) {
      throw new BadRequestException(
        `Holatni ${order.status} dan ${dto.status} ga o'tkazib bo'lmaydi.`,
      );
    }

    if (role === 'ADMIN' && nextStatus === 'DELIVERED') {
      throw new BadRequestException(
        "Admin buyurtmani to'g'ridan-to'g'ri 'Yetkazib berildi' (DELIVERED) qila olmaydi. Faqat 'ON_WAY' (Yetkazib berilmoqda) qilish mumkin.",
      );
    }

    if (nextStatus === 'CANCELLED' && !dto.cancelReason?.trim()) {
      throw new BadRequestException("Bekor qilish sababi ko'rsatilishi kerak.");
    }

    const parsedDeliveryDate =
      dto.deliveryDate !== undefined && dto.deliveryDate !== ''
        ? new Date(dto.deliveryDate)
        : undefined;
    if (parsedDeliveryDate && Number.isNaN(parsedDeliveryDate.getTime())) {
      throw new BadRequestException("Yetkazib berish sanasi noto'g'ri.");
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: nextStatus,
        cancelReason:
          nextStatus === 'CANCELLED'
            ? dto.cancelReason?.trim()
            : order.cancelReason,
        deliveryDate:
          parsedDeliveryDate !== undefined
            ? parsedDeliveryDate
            : order.deliveryDate,
      },
      include: {
        customer: true,
      },
    });

    const currentStatus = nextStatus;
    let statusText = '';
    switch (currentStatus) {
      case 'ACCEPTED': statusText = 'qabul qilindi'; break;
      case 'ON_WAY': statusText = "yo'lga chiqdi"; break;
      case 'DELIVERED': statusText = 'yetkazib berildi'; break;
      case 'CANCELLED': statusText = 'bekor qilindi'; break;
    }

    if (statusText || dto.explanation) {
      const msg = dto.explanation 
        ? dto.explanation 
        : `Sizning #${formatOrderNumber(updatedOrder.id, updatedOrder.createdAt)} buyurtmangiz ${statusText}.${dto.deliveryDate ? ` Taxminiy kunda: ${dto.deliveryDate}` : ''}`;
      
      void this.pushNotificationService.sendNotification(
        updatedOrder.customerId,
        dto.explanation ? 'Yangi xabar' : "Buyurtma holati o'zgardi",
        msg,
        `/orders/${updatedOrder.id}`,
      );

      // Email notification
      void this.mailService.sendOrderStatusEmail(
        updatedOrder.customer.email,
        updatedOrder.customerName,
        formatOrderNumber(updatedOrder.id, updatedOrder.createdAt),
        currentStatus,
        dto.deliveryDate || (order.deliveryDate ? order.deliveryDate.toISOString().split('T')[0] : undefined),
        dto.explanation,
      );
    }

    return updatedOrder;
  }

  async confirmDelivery(id: string, customerId: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestException('Bu buyurtma sizga tegishli emas.');
    }

    if (order.status !== OrderStatus.ON_WAY) {
      throw new BadRequestException(
        "Faqatgina 'Yetkazib berilmoqda' (ON_WAY) holatidagi buyurtmalarni qabul qilishingiz mumkin.",
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.DELIVERED },
    });
  }

  async cancelMyOrder(id: string, customerId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Buyurtma topilmadi.');
    }

    if (order.customerId !== customerId) {
      throw new BadRequestException('Bu buyurtma sizga tegishli emas.');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Faqat kutilayotgan (PENDING) buyurtmalarni bekor qilish mumkin.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Return stock
      for (const item of order.items) {
        if (!item.carpetId) {
          continue;
        }

        await tx.carpet.update({
          where: { id: item.carpetId },
          data: { stock: { increment: item.quantity } },
        });

        // Decrement soldCount
        const carpet = await tx.carpet.findUnique({
          where: { id: item.carpetId },
        });
        if (carpet) {
          await tx.category.update({
            where: { id: carpet.categoryId },
            data: { soldCount: { decrement: item.quantity } },
          });
        }
      }

      // 2. Update order status
      return tx.order.update({
        where: { id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelReason: 'Mijoz tomonidan bekor qilindi',
        },
      });
    });
  }

  private canTransition(from: OrderStatus, to: OrderStatus): boolean {
    const allowed = this.orderTransitionMap[from] ?? [];
    return allowed.includes(to);
  }

  private async loadCarpetMap(
    db: Prisma.TransactionClient | PrismaService,
    items: CreateOrderItemDto[],
  ): Promise<Map<string, CarpetSnapshot>> {
    const carpetIds = [...new Set(items.map((item) => item.carpetId))];
    const carpets = await db.carpet.findMany({
      where: { id: { in: carpetIds } },
      select: {
        id: true,
        price: true,
        discountPercent: true,
        stock: true,
        name: true,
        categoryId: true,
      },
    });

    if (carpets.length !== carpetIds.length) {
      throw new BadRequestException("Ba'zi gilamlar topilmadi.");
    }

    return new Map(carpets.map((carpet) => [carpet.id, carpet]));
  }

  private async resolvePromoCode(
    db: Prisma.TransactionClient | PrismaService,
    customerId: string,
    normalizedPromoCode: string,
  ): Promise<ResolvedPromoCode | null> {
    if (!normalizedPromoCode) return null;

    const promoCode = await db.promoCode.findUnique({
      where: { code: normalizedPromoCode },
      select: {
        id: true,
        code: true,
        discountPercent: true,
        isActive: true,
        startsAt: true,
        expiresAt: true,
        minOrderAmount: true,
        type: true,
        giftName: true,
        giftImage: true,
        giftPrice: true,
      },
    });

    if (!promoCode) {
      throw new BadRequestException('Promokod topilmadi.');
    }

    if (!promoCode.isActive) {
      throw new BadRequestException('Bu promokod hozir faol emas.');
    }

    if (promoCode.startsAt && promoCode.startsAt.getTime() > Date.now()) {
      throw new BadRequestException('Bu promokod hali boshlanmagan.');
    }

    if (promoCode.expiresAt && promoCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Bu promokod vaqti tugagan.');
    }

    const existingUsage = await db.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId: customerId,
        },
      },
    });

    if (existingUsage) {
      throw new BadRequestException(
        "Siz bu promokoddan allaqachon foydalangansiz.",
      );
    }

    return promoCode;
  }

  private buildPricingSummary(
    items: CreateOrderItemDto[],
    carpetMap: Map<string, CarpetSnapshot>,
    promoCode: ResolvedPromoCode | null,
  ): OrderPricingSummary {
    let totalOriginalAmount = 0;
    let subtotalAfterCarpetDiscount = 0;
    let totalAfterPromo = 0;
    const pricingItems: OrderPricingItem[] = [];

    for (const item of items) {
      const carpet = carpetMap.get(item.carpetId);
      if (!carpet) continue;

      const originalUnitPrice = Math.round(Number(carpet.price));
      const unitPriceAfterCarpetDiscount = this.getDiscountedPrice(
        carpet.price,
        carpet.discountPercent,
      );
      const promoDiscountPercent =
        promoCode?.type === 'DISCOUNT' ? promoCode.discountPercent : 0;
      const unitPriceAfterPromo =
        promoCode?.type === 'DISCOUNT'
          ? this.applyPromoDiscount(
              unitPriceAfterCarpetDiscount,
              promoCode.discountPercent,
            )
          : unitPriceAfterCarpetDiscount;

      const lineOriginalTotal = originalUnitPrice * item.quantity;
      const lineAfterCarpetDiscountTotal =
        unitPriceAfterCarpetDiscount * item.quantity;
      const lineTotal = unitPriceAfterPromo * item.quantity;
      const lineProductDiscountAmount =
        lineOriginalTotal - lineAfterCarpetDiscountTotal;
      const linePromoDiscountAmount = lineAfterCarpetDiscountTotal - lineTotal;
      const lineTotalDiscountAmount = lineOriginalTotal - lineTotal;

      totalOriginalAmount += lineOriginalTotal;
      subtotalAfterCarpetDiscount += lineAfterCarpetDiscountTotal;
      totalAfterPromo += lineTotal;

      pricingItems.push({
        carpetId: item.carpetId,
        carpetName: carpet.name,
        quantity: item.quantity,
        originalUnitPrice,
        carpetDiscountPercent: Math.round(Number(carpet.discountPercent ?? 0)),
        unitPriceAfterCarpetDiscount,
        promoDiscountPercent,
        unitPriceAfterPromo,
        lineOriginalTotal,
        lineAfterCarpetDiscountTotal,
        lineTotal,
        lineProductDiscountAmount,
        linePromoDiscountAmount,
        lineTotalDiscountAmount,
      });
    }

    const productDiscountAmount =
      totalOriginalAmount - subtotalAfterCarpetDiscount;
    const promoDiscountAmount = subtotalAfterCarpetDiscount - totalAfterPromo;
    const totalDiscountAmount = totalOriginalAmount - totalAfterPromo;
    const totalDiscountPercent =
      totalOriginalAmount > 0
        ? Math.round((totalDiscountAmount / totalOriginalAmount) * 10000) / 100
        : 0;

    return {
      items: pricingItems,
      totalOriginalAmount,
      subtotalAfterCarpetDiscount,
      totalAfterPromo,
      productDiscountAmount,
      promoDiscountAmount,
      totalDiscountAmount,
      totalDiscountPercent,
    };
  }

  private async reserveStockAndIncrementSales(
    tx: Prisma.TransactionClient,
    items: CreateOrderItemDto[],
    carpetMap: Map<string, CarpetSnapshot>,
  ): Promise<void> {
    const requiredByCarpet = new Map<string, number>();
    for (const item of items) {
      requiredByCarpet.set(
        item.carpetId,
        (requiredByCarpet.get(item.carpetId) ?? 0) + item.quantity,
      );
    }

    for (const [carpetId, requiredQty] of requiredByCarpet.entries()) {
      const carpet = carpetMap.get(carpetId);
      if (!carpet) continue;

      if (carpet.stock < requiredQty) {
        throw new BadRequestException(
          `Kechirasiz, "${carpet.name}" gilamidan omborda yetarli emas. Qoldiq: ${carpet.stock}`,
        );
      }
    }

    for (const [carpetId, requiredQty] of requiredByCarpet.entries()) {
      const carpet = carpetMap.get(carpetId);
      if (!carpet) continue;

      const remainingStock = carpet.stock - requiredQty;

      if (remainingStock <= 0) {
        // Automatically delete the carpet when stock reaches zero
        await tx.carpet.delete({
          where: { id: carpetId },
        });
      } else {
        await tx.carpet.update({
          where: { id: carpetId },
          data: { stock: { decrement: requiredQty } },
        });
      }

      await tx.category.update({
        where: { id: carpet.categoryId },
        data: { soldCount: { increment: requiredQty } },
      });
    }
  }

  private buildTelegramOrderMessage(order: any, pricing: OrderPricingSummary): string {
    const orderNumber = formatOrderNumber(order.id, order.createdAt);
    const promoLabel = order.appliedPromoCode
      ? order.appliedPromoType === 'GIFT'
        ? `${order.appliedPromoCode} (Sovg'a)`
        : `${order.appliedPromoCode} (-${order.appliedPromoPercent || 0}%)`
      : '-';

    return `
<b>Yangi Buyurtma!</b>
<b>Buyurtma:</b> #${orderNumber}
<b>Mijoz:</b> ${order.customerName}
<b>Tel 1:</b> ${this.formatPhoneNumber(order.phone)}
${order.phone2 ? `<b>Tel 2:</b> ${this.formatPhoneNumber(order.phone2)}` : ''}
<b>Manzil:</b> ${order.address}
<b>Soni:</b> ${order.items.length} ta
<b>Promokod:</b> ${promoLabel}
<b>Skidka:</b> ${this.formatCurrency(pricing.totalDiscountAmount)} (${pricing.totalDiscountPercent}%)
<b>Jami:</b> ${this.formatCurrency(pricing.totalAfterPromo)}
`.trim();
  }

  private extractBadRequestMessage(error: BadRequestException): string {
    const response = error.getResponse() as
      | string
      | { message?: string | string[] };
    if (typeof response === 'string') return response;

    if (Array.isArray(response?.message)) {
      return String(response.message[0] ?? 'So\'rovda xatolik.');
    }

    if (typeof response?.message === 'string') {
      return response.message;
    }

    return "So'rovda xatolik yuz berdi.";
  }

  private isInsideTashkent(lat: number, lng: number): boolean {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

    const minLat = 41.1;
    const maxLat = 41.45;
    const minLng = 69.1;
    const maxLng = 69.45;

    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }

  private getDiscountedPrice(price: unknown, discountPercent: unknown): number {
    const basePrice = Number(price);
    if (!Number.isFinite(basePrice)) return 0;

    const percentRaw = Math.round(Number(discountPercent ?? 0));
    const percent = Number.isFinite(percentRaw)
      ? Math.min(99, Math.max(0, percentRaw))
      : 0;

    if (percent <= 0) return Math.round(basePrice);
    return Math.round((basePrice * (100 - percent)) / 100);
  }

  private applyPromoDiscount(price: number, promoPercent: unknown): number {
    const basePrice = Number(price);
    if (!Number.isFinite(basePrice)) return 0;

    const rawPercent = Math.round(Number(promoPercent ?? 0));
    const percent = Number.isFinite(rawPercent)
      ? Math.min(99, Math.max(0, rawPercent))
      : 0;

    if (percent <= 0) return Math.round(basePrice);
    return Math.round((basePrice * (100 - percent)) / 100);
  }

  private normalizePromoCode(rawCode?: string | null): string {
    return String(rawCode ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '');
  }

  private isPromoCodeReuseError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      (error.meta?.target as string[]).includes('promoCodeId') &&
      (error.meta?.target as string[]).includes('userId')
    );
  }

  private formatCurrency(value: number): string {
    const rounded = Math.round(Number(value));
    if (!Number.isFinite(rounded)) return "0 so'm";
    const sign = rounded < 0 ? '-' : '';
    const abs = Math.abs(rounded).toString();
    const formatted = abs.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${sign}${formatted} so'm`;
  }
}
