import { Logger, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ProductsModule } from './products/products.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';
import { validate } from './config/env.validation.js';
import { AuthModule } from './auth/auth.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { AssistantModule } from './assistant/assistant.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

const databaseLogger = new Logger('MongoDB');

@Module({
  imports: [
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        // Do not block the HTTP server from starting when Atlas is temporarily unreachable.
        // Mongo-backed requests will fail individually; routes that do not need Mongo remain usable.
        lazyConnection: true,
        serverSelectionTimeoutMS: 5000,
        onConnectionCreate: (connection) => {
          connection.on('connected', () => databaseLogger.log('MongoDB connected'));
          connection.on('disconnected', () => databaseLogger.warn('MongoDB disconnected'));
          connection.on('error', (error) => databaseLogger.error('MongoDB connection error', error.message));
          return connection;
        },
      }),
    }),
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    BranchesModule,
    ReviewsModule,
    ReportsModule,
    AssistantModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
