import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiPropertyOptional({ enum: OrderStatus, example: OrderStatus.ACCEPTED })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: "Mijoz bilan bog'lanib bo'lmadi" })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancelReason?: string;

  @ApiPropertyOptional({ example: '2024-03-20' })
  @IsOptional()
  @IsString()
  deliveryDate?: string;

  @ApiPropertyOptional({ example: 'Ulov buzilgani sababli kelyapmiz' })
  @IsOptional()
  @IsString()
  explanation?: string;
}
