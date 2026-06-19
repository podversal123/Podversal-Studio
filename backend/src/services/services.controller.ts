import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('services')
export class ServicesController {
  constructor(private services: ServicesService) {}

  // GET /api/services — public, no auth needed (customers see this when booking)
  @Get()
  findAll(@Query('all') all?: string) {
    return this.services.findAll(all !== 'true');
  }

  // GET /api/services/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.services.findOne(id);
  }

  // POST /api/services — SUPER_ADMIN only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  // PATCH /api/services/:id — SUPER_ADMIN only
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }
}
