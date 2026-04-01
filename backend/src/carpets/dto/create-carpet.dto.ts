import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCarpetDto {
  @ApiProperty({ example: 'Premium Turkish Carpet' })
  @IsString()
  @MinLength(2, { message: "Nomi kamida 2 ta belgidan iborat bo'lishi kerak." })
  @MaxLength(150, { message: 'Nomi 150 ta belgidan oshmasligi kerak.' })
  name!: string;

  @ApiProperty({ example: 299.99 })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "Narx son ko'rinishida bo'lishi kerak." },
  )
  @IsPositive({ message: "Narx 0 dan katta bo'lishi kerak." })
  price!: number;

  @ApiProperty({ example: '200x300 sm' })
  @IsString()
  @IsNotEmpty({ message: "O'lcham bo'sh bo'lmasligi kerak." })
  size!: string;

  @ApiProperty({ example: 'Jun' })
  @IsString()
  @IsNotEmpty({ message: 'Material bo`sh bo`lmasligi kerak.' })
  material!: string;

  @ApiPropertyOptional({ example: "Yuqori sifatli gilam, qo'lda to'qilgan." })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'DC-001' }) // Added designCode field
  @IsString()
  @IsOptional()
  designCode?: string;

  @ApiPropertyOptional({
    example: ['/uploads/1710000000000-file.webp'],
    isArray: true,
  })
  @IsArray() // Added IsArray decorator
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber({}, { message: "Miqdor son bo'lishi kerak." })
  @IsPositive({ message: "Miqdor 0 dan katta bo'lishi kerak." })
  stock!: number;

  @ApiProperty({ example: 'cm9xxxxxx' })
  @IsString()
  categoryId!: string;
}
