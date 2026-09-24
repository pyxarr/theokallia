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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import {
  AdminOrdersFilterDto,
  UpdateOrderStatusDto,
} from './dto/admin-orders.dto'
import { Session, UserSession } from '@thallesp/nestjs-better-auth'
import { Order } from '@prisma/client'
import { RolesGuard, Roles } from '../auth/guards/roles.guard'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new order from cart' })
  async create(
    @Session() session: UserSession,
    @Body() dto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.createOrder(session.user.id, dto)
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated user order history' })
  async findAll(@Session() session: UserSession) {
    return this.ordersService.getUserOrders(session.user.id)
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all orders with filtering and pagination (admin)' })
  async findAllAdmin(@Query() filters: AdminOrdersFilterDto) {
    return this.ordersService.getAllOrdersAdmin(filters)
  }

  @Get('admin/metrics')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard metrics (admin)' })
  async getMetrics() {
    return this.ordersService.getAdminMetrics()
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order detail (admin)' })
  async findOneAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderByIdAdmin(id)
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto)
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific order by ID for authenticated user' })
  async findOne(@Param('id') id: string, @Session() session: UserSession) {
    return this.ordersService.getOrderById(session.user.id, id)
  }
}
