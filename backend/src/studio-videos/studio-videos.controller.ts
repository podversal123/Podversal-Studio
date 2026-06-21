import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { StudioVideosService, CreateVideoDto, UpdateVideoDto } from './studio-videos.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('studio-videos')
export class StudioVideosController {
  constructor(private videos: StudioVideosService) {}

  // Public — homepage video section
  @Get('public')
  findPublished() {
    return this.videos.findPublished();
  }

  // Admin — manage all videos
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  findAll() {
    return this.videos.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  findOne(@Param('id') id: string) {
    return this.videos.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  create(@Body() dto: CreateVideoDto) {
    return this.videos.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.videos.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  remove(@Param('id') id: string) {
    return this.videos.remove(id);
  }
}
