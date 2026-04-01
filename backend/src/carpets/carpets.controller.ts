import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CarpetsService } from './carpets.service';
import { CreateCarpetDto } from './dto/create-carpet.dto';
import { CarpetQueryDto } from './dto/carpet-query.dto';
import { UpdateCarpetDto } from './dto/update-carpet.dto';
import { UpdateCarpetDiscountDto } from './dto/update-carpet-discount.dto';
import { UpdateCarpetM2PriceDto } from './dto/update-carpet-m2-price.dto';

@ApiTags('Carpets')
@Controller('carpets')
export class CarpetsController {
  constructor(private readonly carpetsService: CarpetsService) {}

  @ApiOperation({ summary: 'Gilamlar ro`yxati' })
  @ApiResponse({ status: 200, description: "Gilamlar ro'yxati." })
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Query() query: CarpetQueryDto, @Req() req: any) {
    return this.carpetsService.findAll(query, req.user?.sub);
  }

  @ApiOperation({ summary: 'Gilam kolleksiya nomlari ro`yxati (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('names')
  getDistinctNames(@Query('kind') kind?: string) {
    return this.carpetsService.getDistinctNames(kind);
  }

  @ApiOperation({ summary: 'Nom bo`yicha m2 narxini topish (admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('m2-price')
  getCollectionM2Price(@Query('name') name: string) {
    return this.carpetsService.getCollectionM2Price(name);
  }

  @ApiOperation({ summary: 'Kolleksiya bo`yicha skidka qo`shish (admin)' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateCarpetDiscountDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('discount')
  updateDiscount(@Body() dto: UpdateCarpetDiscountDto) {
    return this.carpetsService.updateDiscountByNames(dto);
  }

  @ApiOperation({ summary: 'Kolleksiya bo`yicha m2 narxini yangilash (admin)' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateCarpetM2PriceDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('m2-price')
  updateM2Price(@Body() dto: UpdateCarpetM2PriceDto) {
    return this.carpetsService.updateM2PriceByNames(dto);
  }

  @ApiOperation({ summary: 'Bitta gilamni olish' })
  @ApiResponse({ status: 200, description: "Gilam ma'lumoti." })
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.carpetsService.findOne(id, req.user?.sub);
  }

  @ApiOperation({ summary: 'Gilamga like bosish yoki olib tashlash' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: string, @Req() req: any) {
    return this.carpetsService.toggleLike(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Gilam qo`shish (admin)' })
  @ApiBearerAuth()
  @ApiBody({ type: CreateCarpetDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateCarpetDto) {
    return this.carpetsService.create(dto);
  }

  @ApiOperation({ summary: 'Gilamni tahrirlash (admin)' })
  @ApiBearerAuth()
  @ApiBody({ type: UpdateCarpetDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCarpetDto) {
    return this.carpetsService.update(id, dto);
  }

  @ApiOperation({ summary: "Gilamni o'chirish (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carpetsService.remove(id);
  }
}
