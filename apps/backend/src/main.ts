import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { resolvePort } from './config/port';
import { buildCorsOptions } from './common/config/cors.config';
import { buildValidationOptions } from './common/config/validation.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors(
    buildCorsOptions({
      nodeEnv: configService.get<string>('NODE_ENV') ?? 'development',
      astroSiteUrl: configService.get<string>('ASTRO_SITE_URL'),
      angularAdminUrl: configService.get<string>('ANGULAR_ADMIN_URL'),
    }),
  );
  app.useGlobalPipes(new ValidationPipe(buildValidationOptions()));

  const port = resolvePort(process.env.PORT);
  await app.listen(port);
  Logger.log(`Application is running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  Logger.error('Failed to start the application', error instanceof Error ? error.stack : String(error), 'Bootstrap');
  process.exit(1);
});
