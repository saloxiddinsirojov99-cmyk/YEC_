import { OrderStatus } from '@prisma/client';
export declare class OrderQueryDto {
    page?: number;
    limit?: number;
    status?: OrderStatus;
}
