import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Patch,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  AdminOrdersFilterDto,
  UpdateOrderStatusDto,
} from './dto/admin-orders.dto'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { Order } from '@prisma/client'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Creates a new order from the user's current cart.
   */
  @Post()
  @ApiBearerAuth()
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.createOrder(session.user.id, dto)
  }

  /**
   * Retrieves the order history for the authenticated user.
   */
  @Get()
  @ApiBearerAuth()
  async findAll(@Session() session: UserSession) {
    return this.ordersService.getUserOrders(session.user.id)
  }

  /**
   * Admin-only order list with status filtering and pagination.
   */
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAllAdmin(@Query() filters: AdminOrdersFilterDto) {
    return this.ordersService.getAllOrdersAdmin(filters)
  }

  /**
   * Aggregate dashboard metrics for the overview cards.
   * Declared before admin/:id so 'metrics' is not captured as an order id.
   */
  @Get('admin/metrics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async getMetrics() {
    return this.ordersService.getAdminMetrics()
  }

  /**
   * Admin-only order detail — no ownership check.
   */
  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findOneAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderByIdAdmin(id)
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto)
  }

  /**
   * Retrieves a specific order by ID for the authenticated user.
   */
  @Get(':id')
  @ApiBearerAuth()
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.ordersService.getOrderById(session.user.id, id)
  }
}
