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
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { resolveUploadsDir } from './common/utils/uploads-path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

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

function mapValidationMessage(constraint: string): string {
  const normalized = constraint.toLowerCase();

  if (normalized.includes('should not exist'))
    return 'Ruxsat etilmagan maydon yuborildi.';
  if (normalized.includes('must be longer than or equal to'))
    return 'Maydon uzunligi yetarli emas.';
  if (normalized.includes('must be shorter than or equal to'))
    return 'Maydon uzunligi juda katta.';
  if (normalized.includes('must be an email'))
    return "Email formati noto'g'ri.";
  if (normalized.includes('must be a string'))
    return "Maydon matn ko'rinishida bo'lishi kerak.";
  if (normalized.includes('must not be empty'))
    return "Maydon bo'sh bo'lmasligi kerak.";
  if (normalized.includes('must be longer')) return 'Maydon juda qisqa.';
  if (normalized.includes('must be shorter')) return 'Maydon juda uzun.';
  if (normalized.includes('must be a number'))
    return "Maydon son bo'lishi kerak.";
  if (normalized.includes('must be a positive number'))
    return "Maydon 0 dan katta bo'lishi kerak.";
  if (normalized.includes('must be an integer number'))
    return "Maydon butun son bo'lishi kerak.";
  if (normalized.includes('must be one of'))
    return "Maydon qiymati ruxsat etilgan variantlardan biri bo'lishi kerak.";
  if (normalized.includes('must be a phone number'))
    return "Telefon raqam formati noto'g'ri.";
  if (normalized.includes('each value in'))
    return "Ro'yxatdagi qiymatlar noto'g'ri formatda yuborildi.";
  if (normalized.includes('nested property'))
    return "Ichki obyekt ma'lumotlarida xatolik mavjud.";
  if (normalized.includes('array'))
    return "Maydon ro'yxat (array) bo'lishi kerak.";
  if (normalized.includes('date')) return "Sana formati noto'g'ri yuborildi.";

  return "Maydon qiymati noto'g'ri.";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

async function listenWithRetry(app: any, port: number, host = '0.0.0.0', retryCount = 0): Promise<void> {
  const MAX_RETRIES = 10;
  try {
    await app.listen(port, host);
    logger.log(`Backend ishlayapti: ${host}:${port}`);
  } catch (error: any) {
    if (error?.code === 'EADDRINUSE') {
      if (retryCount < MAX_RETRIES) {
        logger.warn(`Port ${port} band. 3 soniyadan keyin qayta urinamiz (urinish: ${retryCount + 1}/${MAX_RETRIES})...`);
        await sleep(3000);
        return listenWithRetry(app, port, host, retryCount + 1);
      }
      logger.error(`Port ${port} band. Maksimal urinishlar tugadi. Jarayon to'xtatilmoqda.`);
    } else {
      logger.error('Backend ishga tushirishda xatolik.', error);
    }
    throw error;
  }
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
        const validationMessages = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}).map(mapValidationMessage),
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
  await listenWithRetry(app, port, host);
}

void bootstrap().catch((error) => {
  const trace =
    error instanceof Error ? error.stack ?? error.message : String(error);
  logger.error('Backend ishga tushmadi.', trace);
  process.exit(1);
});
