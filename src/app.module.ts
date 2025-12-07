import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl =
          configService.get('STORAGE_POSTGRES_URL') ||
          configService.get('STORAGE_DATABASE_URL') ||
          configService.get('POSTGRES_URL') ||
          configService.get('DATABASE_URL');

        if (!dbUrl) {
          throw new Error('Database connection string not found. Checked: STORAGE_POSTGRES_URL, POSTGRES_URL, DATABASE_URL.');
        }
        return {
          type: 'postgres',
          url: dbUrl,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          ssl: true, // Vercel Postgres (Neon) requires SSL
          extra: {
            ssl: {
              rejectUnauthorized: false, // Required for some Neon connections
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
