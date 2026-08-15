import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { resolvePort } from './config/port';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = resolvePort(process.env.PORT);
  await app.listen(port);
  Logger.log(`Application is running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('Failed to start the application', error instanceof Error ? error.stack : String(error), 'Bootstrap');
  process.exit(1);
});
