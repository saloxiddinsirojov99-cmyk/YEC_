import { existsSync, mkdirSync } from 'fs';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { createServer } from 'net';
import { AppModule } from './app.module';
import { resolveUploadsDir } from './common/utils/uploads-path';
import { setupApp } from './setup-app';

const envCandidates = [
  join(process.cwd(), '.env'),
  join(__dirname, '..', '.env'),
  join(__dirname, '..', '..', '.env'),
];
const envPath = envCandidates.find((candidate) => existsSync(candidate));
if (process.env.NODE_ENV !== 'production' && envPath) {
  loadEnv({ path: envPath, override: false });
}

const logger = new Logger('Bootstrap');

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
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    logger.error('Tutilmagan istisno (uncaughtException).', trace);
  });

  process.on('unhandledRejection', (reason) => {
    const trace =
      reason instanceof Error
        ? (reason.stack ?? reason.message)
        : String(reason);

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
  try {
    mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {
    logger.warn(`Uploads katalogini yaratishda ogohlantirish: ${err}`);
  }
  registerProcessGuards();

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  setupApp(app);

  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3001);
  await waitForPortAvailability(port, host);
  await app.listen(port, host);
  logger.log(`Backend ishlayapti: ${host}:${port}`);
}

if (!process.env.VERCEL) {
  void bootstrap().catch((error) => {
    const trace =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    logger.error('Backend ishga tushmadi.', trace);
    process.exit(1);
  });
}
