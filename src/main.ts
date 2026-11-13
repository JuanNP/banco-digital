import { ConsoleLogger, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: process.env.NODE_ENV === 'production',
      timestamp: true,
    }),
  });

  configureApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`GraphQL ready at http://localhost:${port}/graphql`, 'Bootstrap');
}
await bootstrap();
