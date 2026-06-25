import { Injectable } from '@nestjs/common';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateGalleryImageDto {
  @IsString()  @IsOptional() title?:       string;
  @IsString()                imageUrl:     string;
  @IsString()  @IsOptional() category?:    string;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsNumber()  @IsOptional() sortOrder?:   number;
  @IsString()  @IsOptional() source?:      string;
}

export class UpdateGalleryImageDto {
  @IsString()  @IsOptional() title?:       string;
  @IsString()  @IsOptional() imageUrl?:    string;
  @IsString()  @IsOptional() category?:    string;
  @IsBoolean() @IsOptional() isPublished?: boolean;
  @IsNumber()  @IsOptional() sortOrder?:   number;
}

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  findPublished() {
    return this.prisma.galleryImage.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  findAll() {
    return this.prisma.galleryImage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  create(dto: CreateGalleryImageDto, uploadedBy: string) {
    return this.prisma.galleryImage.create({ data: { ...dto, uploadedBy } });
  }

  update(id: string, dto: UpdateGalleryImageDto) {
    return this.prisma.galleryImage.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.galleryImage.delete({ where: { id } });
  }
}
