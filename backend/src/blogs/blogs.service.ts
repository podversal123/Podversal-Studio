import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

export class CreateBlogDto {
  @IsString()  title:      string;
  @IsString()  slug:       string;
  @IsString()  excerpt:    string;
  @IsString()  content:    string;
  @IsString()  @IsOptional() coverImage?: string;
  @IsString()  @IsOptional() category?:   string;
  @IsArray()   @IsOptional() tags?:        string[];
  @IsBoolean() @IsOptional() isPublished?: boolean;
}

export class UpdateBlogDto {
  @IsString()  @IsOptional() title?:      string;
  @IsString()  @IsOptional() slug?:       string;
  @IsString()  @IsOptional() excerpt?:    string;
  @IsString()  @IsOptional() content?:    string;
  @IsString()  @IsOptional() coverImage?: string;
  @IsString()  @IsOptional() category?:   string;
  @IsArray()   @IsOptional() tags?:        string[];
  @IsBoolean() @IsOptional() isPublished?: boolean;
}

@Injectable()
export class BlogsService {
  constructor(private prisma: PrismaService) {}

  // Public: only published posts, ordered by date
  findPublished() {
    return this.prisma.blog.findMany({
      where: { isPublished: true },
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImage: true, category: true, tags: true, publishedAt: true,
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  // Public: single post by slug
  async findBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
      include: { author: { select: { name: true } } },
    });
    if (!blog || !blog.isPublished) throw new NotFoundException('Blog post not found');
    return blog;
  }

  // Admin: all posts (published + drafts)
  findAll() {
    return this.prisma.blog.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: single post by ID (for editing)
  async findOne(id: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: { author: { select: { name: true } } },
    });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async create(dto: CreateBlogDto, authorId: string) {
    const existing = await this.prisma.blog.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('A post with this slug already exists');

    return this.prisma.blog.create({
      data: {
        ...dto,
        authorId,
        publishedAt: dto.isPublished ? new Date() : null,
      },
    });
  }

  async update(id: string, dto: UpdateBlogDto) {
    await this.findOne(id);

    // If slug is changing, ensure the new slug is unique
    if (dto.slug) {
      const existing = await this.prisma.blog.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (existing) throw new ConflictException('Slug already taken');
    }

    return this.prisma.blog.update({
      where: { id },
      data: {
        ...dto,
        // Set publishedAt when first publishing; don't overwrite if already set
        ...(dto.isPublished === true
          ? { publishedAt: new Date() }
          : dto.isPublished === false
          ? { publishedAt: null }
          : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.blog.delete({ where: { id } });
  }
}
