import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EmployeesService, CreateEmployeeDto, UpdateEmployeeDto } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private employees: EmployeesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  findAll() {
    return this.employees.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER', 'EMPLOYEE')
  findOne(@Param('id') id: string) {
    return this.employees.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employees.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN')
  deactivate(@Param('id') id: string) {
    return this.employees.deactivate(id);
  }

  @Get(':id/schedule')
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER', 'EMPLOYEE')
  getSchedule(@Param('id') id: string, @Query('date') date: string) {
    return this.employees.getSchedule(id, date);
  }
}
