import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExceptionsFilter } from './filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });

  app.setGlobalPrefix('/api');
  app.useGlobalFilters(new ExceptionsFilter());
  await app.listen(process.env.PORT);
}
bootstrap();
