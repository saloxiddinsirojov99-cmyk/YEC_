import { CreateOrderItemDto } from './create-order-item.dto';
export declare class CreateOrderDto {
    customerName: string;
    phone: string;
    address: string;
    comment?: string;
    items: CreateOrderItemDto[];
}
