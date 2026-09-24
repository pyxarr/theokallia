import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { FilterProductsDto } from './dto/filter-products.dto'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/guards/roles.guard'

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Public endpoints 

  // main shop listing — accepts all filter/sort/pagination params as query strings
  // e.g. GET /products?category=bracelets&sort=price-asc&page=1&limit=12
  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List all products with optional filtering and sorting' })
  findAll(@Query() filters: FilterProductsDto) {
    return this.productsService.findAll(filters)
  }

  @Get('test-sentry')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Test Sentry Backend' })
  testSentry() {
    throw new Error('Sentry Backend Test');
  }

  // product detail page — fetches full product data including reviews and rating
  // e.g. GET /products/temi-gold-bracelet
  @Get(':slug')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a single product by slug' })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug)
  }

  // similar products section on the product detail page
  // e.g. GET /products/temi-gold-bracelet/similar
  @Get(':slug/similar')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get 3 similar products from the same category' })
  findSimilar(@Param('slug') slug: string) {
    return this.productsService.findSimilar(slug)
  }

  // Admin endpoints 
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product (admin only)' })
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
  }

  @Patch(':slug')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product by slug (admin only)' })
  update(@Param('slug') slug: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(slug, dto)
  }

  @Delete(':slug')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product by slug (admin only)' })
  delete(@Param('slug') slug: string) {
    return this.productsService.delete(slug)
  }
}
