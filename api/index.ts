import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

export default async function handler(req, res) {
    const app = await NestFactory.create(AppModule);
    app.enableCors(); // Enable CORS for Vercel
    await app.init();
    const instance = app.getHttpAdapter().getInstance();
    return instance(req, res);
}
