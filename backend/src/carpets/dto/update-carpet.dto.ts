import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCarpetDto {
  @ApiPropertyOptional({ example: 'Updated Carpet Name' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Nomi kamida 2 ta belgidan iborat bo'lishi kerak." })
  @MaxLength(150, { message: 'Nomi 150 ta belgidan oshmasligi kerak.' })
  name?: string;

  @ApiPropertyOptional({ example: 399.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "Narx son ko'rinishida bo'lishi shart." },
  )
  @IsPositive({ message: "Narx 0 dan katta bo'lishi shart." })
  price?: number;

  @ApiPropertyOptional({ example: '160x230 sm' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "O'lcham bo'sh bo'lmasligi kerak." })
  size?: string;

  @ApiPropertyOptional({ example: 'Paxta' })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Material bo`sh bo`lmasligi kerak.' })
  material?: string;

  @ApiPropertyOptional({ example: 'Yangilangan tavsif' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'DC-001' })
  @IsOptional()
  @IsString()
  designCode?: string;

  @ApiPropertyOptional({ example: ['/uploads/new-file.webp'], isArray: true })
  @IsOptional()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Miqdor son bo'lishi kerak." })
  @IsPositive({ message: "Miqdor 0 dan katta bo'lishi kerak." })
  stock?: number;

  @ApiPropertyOptional({ example: 'cm9xxxxxx' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}
