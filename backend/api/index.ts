import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

const server: Express = express();
let isReady = false;
let bootstrapPromise: Promise<void> | null = null;

async function bootstrapServerless(): Promise<void> {
  if (isReady) return;
  if (bootstrapPromise) return bootstrapPromise;

  bootstrapPromise = (async () => {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
      { bodyParser: true },
    );
    setupApp(app);
    await app.init();
    isReady = true;
  })();

  return bootstrapPromise;
}

export default async function handler(req: Request, res: Response) {
  await bootstrapServerless();
  server(req, res);
}
