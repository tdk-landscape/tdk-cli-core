import 'reflect-metadata';
import { Controller, Get, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

@Controller()
class AppController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Get('orders')
  orders() {
    return [{ id: 1, item: 'tea' }];
  }
}

@Module({ controllers: [AppController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
bootstrap();
