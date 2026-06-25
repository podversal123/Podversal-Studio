import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { BlogsService, CreateBlogDto, UpdateBlogDto } from './blogs.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('blogs')
export class BlogsController {
  constructor(private blogs: BlogsService) {}

  // Public — no auth required
  @Get('public')
  findPublished() {
    return this.blogs.findPublished();
  }

  @Get('public/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogs.findBySlug(slug);
  }

  // Admin — SUPER_ADMIN only for create/edit/delete
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  findAll() {
    return this.blogs.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'STUDIO_MANAGER')
  findOne(@Param('id') id: string) {
    return this.blogs.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateBlogDto, @CurrentUser() user: any) {
    return this.blogs.create(dto, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    return this.blogs.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.blogs.remove(id);
  }
}
