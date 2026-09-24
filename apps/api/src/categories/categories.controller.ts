import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { CreateSubcategoryDto } from './dto/create-subcategory.dto'
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/guards/roles.guard'

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Public endpoints

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'List all categories with their subcategories' })
  findAll() {
    return this.categoriesService.findAllCategories()
  }

  @Get(':slug')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get a single category by slug with its subcategories' })
  findOne(@Param('slug') slug: string) {
    return this.categoriesService.findOneCategory(slug)
  }

  // Admin endpoints

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new category (admin only)' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.createCategory(dto)
  }

  @Patch(':slug')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category by slug (admin only)' })
  updateCategory(@Param('slug') slug: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(slug, dto)
  }

  @Delete(':slug')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category by slug (admin only)' })
  deleteCategory(@Param('slug') slug: string) {
    return this.categoriesService.deleteCategory(slug)
  }

  // Subcategory endpoints (nested under category slug)

  @Post(':slug/subcategories')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a subcategory under a category (admin only)' })
  createSubcategory(
    @Param('slug') categorySlug: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.categoriesService.createSubcategory(categorySlug, dto)
  }

  @Patch(':slug/subcategories/:subSlug')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a subcategory (admin only)' })
  updateSubcategory(
    @Param('slug') categorySlug: string,
    @Param('subSlug') subSlug: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.categoriesService.updateSubcategory(categorySlug, subSlug, dto)
  }

  @Delete(':slug/subcategories/:subSlug')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a subcategory (admin only)' })
  deleteSubcategory(
    @Param('slug') categorySlug: string,
    @Param('subSlug') subSlug: string,
  ) {
    return this.categoriesService.deleteSubcategory(categorySlug, subSlug)
  }
}
