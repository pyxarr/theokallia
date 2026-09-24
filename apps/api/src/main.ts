import 'dotenv/config'
import './instrument'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  // bodyParser must be disabled at app creation — Better Auth handles its own body parsing
  const app = await NestFactory.create(AppModule, { bodyParser: false, rawBody: true })

  // Security headers
  app.use(helmet())

  app.use(cookieParser())

  // CORS — only allow frontend origins
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3002',
        'https://theokallia.vercel.app',
        'https://theokallia.com',
        'https://admin.theokallia.com',
      ]

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  // URI versioning — all routes prefixed with /v{n}/
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  // Global validation — strips unknown fields, auto-transforms DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Theokallia API')
    .setDescription('Theokallia jewellery API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  await app.listen(process.env.PORT ?? 3333)
}

void bootstrap()
