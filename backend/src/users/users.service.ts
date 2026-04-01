import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }
    return user;
  }

  async createCustomer(
    name: string,
    email: string,
    phone: string,
    hashedPassword: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.",
      );
    }

    return this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.CUSTOMER,
      },
    });
  }

  async createAdmin(
    name: string,
    email: string,
    phone: string,
    hashedPassword: string,
  ): Promise<User> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException(
        "Bu email bilan foydalanuvchi allaqachon ro'yxatdan o'tgan.",
      );
    }

    return this.prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        lat: true,
        lng: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                carpet: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    size: true,
                    material: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Profil topilmadi.');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.findById(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phone: dto.phone,
        avatar: dto.avatar,
        address: dto.address,
        lat: dto.lat,
        lng: dto.lng,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        address: true,
        lat: true,
        lng: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(currentUserId: string, userId: string) {
    if (currentUserId === userId) {
      throw new BadRequestException("O'zingizni o'chira olmaysiz.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    const ordersCount = await this.prisma.order.count({
      where: { customerId: userId },
    });

    if (ordersCount > 0) {
      throw new BadRequestException(
        "Bu foydalanuvchini o'chirib bo'lmaydi, chunki unda buyurtmalar mavjud.",
      );
    }

    return this.prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });
  }

  async updateRole(currentUserId: string, userId: string, role: UserRole) {
    if (currentUserId === userId) {
      throw new BadRequestException("O'z rolingizni o'zgartira olmaysiz.");
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi.');
    }

    if (user.role === UserRole.SUPERADMIN) {
      throw new BadRequestException("SUPERADMIN rolini o'zgartira olmaysiz.");
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
  }

  async getAdminStats() {
    const [
      usersCount,
      carpetsCount,
      pendingCount,
      acceptedCount,
      deliveredCount,
      cancelledCount,
      onWayCount,
    ] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.carpet.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'ACCEPTED' } }),
      this.prisma.order.count({ where: { status: 'DELIVERED' } }),
      this.prisma.order.count({ where: { status: 'CANCELLED' } }),
      this.prisma.order.count({ where: { status: 'ON_WAY' } }),
    ]);

    return {
      usersCount,
      carpetsCount,
      orders: {
        total: pendingCount + acceptedCount + deliveredCount + cancelledCount + onWayCount,
        pending: pendingCount,
        accepted: acceptedCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        onWay: onWayCount,
      },
    };
  }
}
