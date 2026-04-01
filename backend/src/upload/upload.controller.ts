import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { resolveUploadsDir } from '../common/utils/uploads-path';

const UPLOADS_DIR = resolveUploadsDir();
mkdirSync(UPLOADS_DIR, { recursive: true });

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  @ApiOperation({ summary: 'Rasm yuklash (admin)' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Rasm muvaffaqiyatli yuklandi.' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname);
          cb(null, `${Date.now()}-${randomUUID()}${extension}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024,
      },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          cb(
            new BadRequestException(
              'Faqat JPG, PNG va WEBP formatlari ruxsat etiladi.',
            ) as never,
            false,
          );
          return;
        }

        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      url: `/uploads/${file.filename}`,
    };
  }
}
