import { Injectable, NotFoundException } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateVideoDto {
  @IsString()  title:         string;
  @IsString()  @IsOptional() description?:   string;
  @IsString()  @IsOptional() youtubeId?:     string;
  @IsString()  @IsOptional() cloudinaryUrl?: string;
  @IsString()  @IsOptional() thumbnailUrl?:  string;
  @IsString()  @IsOptional() category?:      string;
  @IsBoolean() @IsOptional() isPublished?:   boolean;
  @IsNumber()  @IsOptional() sortOrder?:     number;
}

export class UpdateVideoDto {
  @IsString()  @IsOptional() title?:         string;
  @IsString()  @IsOptional() description?:   string;
  @IsString()  @IsOptional() youtubeId?:     string;
  @IsString()  @IsOptional() cloudinaryUrl?: string;
  @IsString()  @IsOptional() thumbnailUrl?:  string;
  @IsString()  @IsOptional() category?:      string;
  @IsBoolean() @IsOptional() isPublished?:   boolean;
  @IsNumber()  @IsOptional() sortOrder?:     number;
}

@Injectable()
export class StudioVideosService {
  constructor(private prisma: PrismaService) {}

  // Public: only published, sorted by sortOrder
  findPublished() {
    return this.prisma.studioVideo.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Admin: all videos
  findAll() {
    return this.prisma.studioVideo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const video = await this.prisma.studioVideo.findUnique({ where: { id } });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  create(dto: CreateVideoDto) {
    return this.prisma.studioVideo.create({ data: dto });
  }

  async update(id: string, dto: UpdateVideoDto) {
    await this.findOne(id);
    return this.prisma.studioVideo.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.studioVideo.delete({ where: { id } });
  }
}
