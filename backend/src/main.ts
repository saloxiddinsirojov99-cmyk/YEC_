import { existsSync, mkdirSync } from 'fs';
import {
  BadRequestException,
  Logger,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { createServer } from 'net';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { resolveUploadsDir } from './common/utils/uploads-path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';

const envCandidates = [
  join(process.cwd(), '.env'),
  join(__dirname, '..', '.env'),
  join(__dirname, '..', '..', '.env'),
];
const envPath = envCandidates.find((candidate) => existsSync(candidate));
if (process.env.NODE_ENV !== 'production' && envPath) {
  // Respect runtime/exported env vars (for example PORT or TELEGRAM_LAUNCH)
  // and only fill missing keys from .env.
  loadEnv({ path: envPath, override: false });
}

const logger = new Logger('Bootstrap');

type ValidationErrorNode = {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationErrorNode[];
};

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Parol',
  newPassword: 'Yangi parol',
  phone: 'Telefon raqam',
  firstName: 'Ism',
  lastName: 'Familiya',
  otp: 'Tasdiqlash kodi',
  name: 'Nomi',
  description: 'Tavsif',
  title: 'Sarlavha',
  image: 'Rasm',
  images: 'Rasmlar',
  price: 'Narx',
  discount: 'Chegirma',
  quantity: 'Miqdor',
  size: "O'lcham",
  material: 'Material',
  status: 'Holat',
  role: 'Rol',
  address: 'Manzil',
  lat: 'Kenglik',
  lng: 'Uzunlik',
  paymentType: "To'lov turi",
  comment: 'Izoh',
};

function prettifyField(path: string): string {
  const lastKey = path.split('.').pop() ?? path;
  const normalizedKey = lastKey.replace(/\[\d+\]/g, '');
  if (FIELD_LABELS[normalizedKey]) {
    return FIELD_LABELS[normalizedKey];
  }

  return normalizedKey
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function mapValidationMessage(fieldPath: string, constraint: string): string {
  const normalized = constraint.toLowerCase();
  const field = prettifyField(fieldPath);

  if (normalized.includes('should not exist')) {
    return `${field} maydoni ruxsat etilmagan.`;
  }
  if (normalized.includes('must not be empty')) {
    return `${field} maydoni bo'sh bo'lmasligi kerak.`;
  }
  if (normalized.includes('must be an email')) {
    return `${field} formati noto'g'ri.`;
  }
  if (normalized.includes('must be longer than or equal to')) {
    return `${field} maydoni juda qisqa.`;
  }
  if (normalized.includes('must be shorter than or equal to')) {
    return `${field} maydoni juda uzun.`;
  }
  if (normalized.includes('must be a string')) {
    return `${field} maydoni matn bo'lishi kerak.`;
  }
  if (normalized.includes('must be a number')) {
    return `${field} maydoni son bo'lishi kerak.`;
  }
  if (normalized.includes('must be a positive number')) {
    return `${field} maydoni 0 dan katta bo'lishi kerak.`;
  }
  if (normalized.includes('must be an integer number')) {
    return `${field} maydoni butun son bo'lishi kerak.`;
  }
  if (normalized.includes('must be one of')) {
    return `${field} maydoni ruxsat etilgan qiymatlardan biri bo'lishi kerak.`;
  }
  if (normalized.includes('must be a phone number')) {
    return `${field} formati noto'g'ri.`;
  }
  if (normalized.includes('array')) {
    return `${field} maydoni ro'yxat (array) bo'lishi kerak.`;
  }
  if (normalized.includes('date')) {
    return `${field} maydoni sana formatida bo'lishi kerak.`;
  }
  if (normalized.includes('boolean')) {
    return `${field} maydoni true/false qiymatda bo'lishi kerak.`;
  }
  if (normalized.includes('uuid')) {
    return `${field} maydoni UUID formatida bo'lishi kerak.`;
  }
  if (normalized.includes('nested property')) {
    return `${field} maydonida ichki ma'lumot xato yuborilgan.`;
  }

  const looksLikeDefaultConstraint =
    normalized.includes('must ') ||
    normalized.includes('should ') ||
    normalized.includes('is ') ||
    normalized.includes('each value in');

  // Preserve custom validator messages from DTOs as-is.
  if (!looksLikeDefaultConstraint) {
    return constraint;
  }

  // Unknown class-validator message fallback
  return `${field} maydoni noto'g'ri to'ldirilgan.`;
}

function collectValidationMessages(
  errors: ValidationErrorNode[],
  parentPath = '',
): string[] {
  return errors.flatMap((error) => {
    const currentPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    const ownMessages = Object.values(error.constraints ?? {}).map((msg) =>
      mapValidationMessage(currentPath, msg),
    );
    const childMessages = error.children?.length
      ? collectValidationMessages(error.children, currentPath)
      : [];

    return [...ownMessages, ...childMessages];
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function checkPortAvailability(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.unref();

    server.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE' || error.code === 'EACCES') {
        resolve(false);
        return;
      }

      logger.error(
        `Port ${port} holatini tekshirishda xatolik: ${error.message}`,
      );
      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function waitForPortAvailability(
  port: number,
  host = '0.0.0.0',
): Promise<void> {
  const MAX_RETRIES = 10;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const available = await checkPortAvailability(port, host);
    if (available) {
      return;
    }

    if (attempt === MAX_RETRIES) {
      const error = new Error(`Port ${port} band.`);
      (error as NodeJS.ErrnoException).code = 'EADDRINUSE';
      throw error;
    }

    logger.warn(
      `Port ${port} band. 3 soniyadan keyin qayta tekshiramiz (urinish: ${attempt + 1}/${MAX_RETRIES})...`,
    );
    await sleep(3000);
  }
}

function registerProcessGuards(): void {
  process.on('uncaughtException', (error) => {
    const trace =
      error instanceof Error ? error.stack ?? error.message : String(error);
    logger.error('Tutilmagan istisno (uncaughtException).', trace);
  });

  process.on('unhandledRejection', (reason) => {
    const trace =
      reason instanceof Error ? reason.stack ?? reason.message : String(reason);

    // Telegram is optional. In restricted environments (no outbound internet),
    // telegraf may fail on getMe during startup. Keep backend alive and log
    // a friendly warning instead of noisy fatal-style errors.
    const lowered = trace.toLowerCase();
    const isTelegramGetMeFailure =
      lowered.includes('api.telegram.org') &&
      lowered.includes('/getme') &&
      (lowered.includes('eacces') ||
        lowered.includes('econnrefused') ||
        lowered.includes('etimedout') ||
        lowered.includes('enotfound'));
    if (isTelegramGetMeFailure) {
      logger.warn(
        "Telegram ulanishi muvaffaqiyatsiz (tarmoq cheklangan bo'lishi mumkin). TELEGRAM_ENABLED=false yoki TELEGRAM_LAUNCH=false qilib qo'yishingiz mumkin.",
      );
      return;
    }

    logger.error('Tutilmagan promise xatosi (unhandledRejection).', trace);
  });
}

async function bootstrap() {
  const uploadsDir = resolveUploadsDir();
  mkdirSync(uploadsDir, { recursive: true });
  registerProcessGuards();

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  app.use(require('express').json({ limit: '20mb' }));
  app.use(require('express').urlencoded({ limit: '20mb', extended: true }));
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: 'api/v1', method: RequestMethod.GET },
    ],
  });
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(compression());
  app.use(helmet());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,
      message: "Juda ko'p so'rov yuborildi. Iltimos, birozdan so'ng qayta urinib ko'ring.",
    }),
  );
  const requestTimeoutMs = Number(process.env.REQUEST_TIMEOUT_MS || 45000);
  app.useGlobalInterceptors(new TimeoutInterceptor(requestTimeoutMs));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const validationMessages = collectValidationMessages(
          errors as ValidationErrorNode[],
        );

        return new BadRequestException({
          message:
            validationMessages[0] ?? "So'rov ma'lumotlarida xatolik mavjud.",
          errors: validationMessages,
        });
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('YEC Market API')
    .setDescription('Gilam savdosi uchun backend API hujjatlari')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3001);
  await waitForPortAvailability(port, host);
  await app.listen(port, host);
  logger.log(`Backend ishlayapti: ${host}:${port}`);
}

void bootstrap().catch((error) => {
  const trace =
    error instanceof Error ? error.stack ?? error.message : String(error);
  logger.error('Backend ishga tushmadi.', trace);
  process.exit(1);
});
