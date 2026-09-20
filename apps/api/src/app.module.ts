import { Module } from '@nestjs/common'
import { APP_FILTER } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { SentryModule } from '@sentry/nestjs/setup'
import { SentryGlobalFilter } from '@sentry/nestjs/setup'
import { BullModule } from '@nestjs/bullmq'
import { UsersModule } from './users/users.module'
import { CategoriesModule } from './categories/categories.module'
import { ProductsModule } from './products/products.module'
import { ReviewsModule } from './reviews/reviews.module'
import { PrismaModule } from './prisma/prisma.module'
import { RedisModule } from './redis/redis.module'
import { MailModule } from './mail/mail.module'
import { CartModule } from './cart/cart.module'
import { WishlistModule } from './wishlist/wishlist.module'
import { OrdersModule } from './orders/orders.module'
import { PaymentsModule } from './payments/payments.module'
import { RateLimitModule } from './rate-limit/rate-limit.module'
import { UploadModule } from './upload/upload.module'
import { ContentModule } from './content/content.module'
import { SubscribersModule } from './subscribers/subscribers.module'
import { CouponsModule } from './coupons/coupons.module'
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth'
import { auth } from './auth/auth'
import * as Joi from 'joi'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().required(),
        PORT: Joi.number().required(),
        FRONTEND_URL: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        BETTER_AUTH_SECRET: Joi.string().required(),
        BETTER_AUTH_URL: Joi.string().required(),
        SENTRY_DSN: Joi.string().uri().optional(),
        REDIS_URL: Joi.string().required(),
        MAIL_FROM: Joi.string().required(),
        PAYSTACK_SECRET_KEY: Joi.string().required(),
        PAYSTACK_PUBLIC_KEY: Joi.string().required(),
        CLOUDINARY_CLOUD_NAME: Joi.string().required(),
        CLOUDINARY_API_KEY: Joi.string().required(),
        CLOUDINARY_API_SECRET: Joi.string().required(),
        ADMIN_ALERT_EMAIL: Joi.string().email().optional(),
        RESEND_API_KEY: Joi.string().optional(),
        RESEND_AUDIENCE_ID: Joi.string().optional(),
      }),
    }),
    // Register BullMQ globally — all queues use this Redis connection
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL,
        tls: {},
      },
    }),
    BetterAuthModule.forRoot({ auth }),
    SentryModule.forRoot(),
    PrismaModule,
    RedisModule,
    MailModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    CouponsModule,
    PaymentsModule,
    RateLimitModule,
    UploadModule,
    ContentModule,
    SubscribersModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
