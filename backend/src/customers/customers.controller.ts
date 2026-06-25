import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CustomersService, UpdateCustomerDto } from './customers.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'STUDIO_MANAGER', 'EMPLOYEE')
export class CustomersController {
  constructor(private customers: CustomersService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.customers.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customers.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.customers.getStats(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customers.update(id, dto);
  }
}
