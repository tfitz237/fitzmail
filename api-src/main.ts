import { NestFactory } from '@nestjs/core';
import { RootModule } from './app.module';
import express = require('express');
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(RootModule, { cors: true});
  app.use(express.static(path.join(__dirname, '../dist', 'browser')));
  await app.listen(3000);
}
bootstrap();
