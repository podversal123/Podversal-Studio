import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key:    this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async create(data: {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role?: Role;
    googleId?: string;
  }) {
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 12)
      : undefined;

    return this.prisma.user.create({
      data: { ...data, password: hashedPassword },
    });
  }

  async updateProfile(id: string, data: { name?: string; phone?: string; avatarUrl?: string }) {
    if (data.phone) {
      const conflict = await this.prisma.user.findFirst({ where: { phone: data.phone, NOT: { id } } });
      if (conflict) throw new ConflictException('Phone number already in use');
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
    });
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user?.password) throw new BadRequestException('Cannot change password — this account uses Google sign-in');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { password: hashed } });
    return { message: 'Password updated successfully' };
  }

  async uploadAvatar(id: string, base64DataUrl: string) {
    const result = await cloudinary.uploader.upload(base64DataUrl, {
      folder: 'podversal/avatars',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
    });
    return this.updateProfile(id, { avatarUrl: result.secure_url });
  }

  findManagers() {
    return this.prisma.user.findMany({
      where: { role: Role.STUDIO_MANAGER },
      select: { id: true, name: true, email: true, phone: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<{ user: any; isNew: boolean }> {
    let user = await this.findByGoogleId(profile.googleId);
    if (user) {
      // Fix any previously stored bad name (e.g. "officeinbox undefined")
      if (user.name?.toLowerCase().includes('undefined')) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { name: profile.name },
        });
      }
      return { user, isNew: false };
    }

    user = await this.findByEmail(profile.email);
    if (user) {
      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: profile.googleId,
          // Also fix name if it was stored incorrectly before
          ...(user.name?.toLowerCase().includes('undefined') ? { name: profile.name } : {}),
        },
      });
      return { user: updated, isNew: false };
    }

    const created = await this.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      role: Role.CUSTOMER,
    });
    return { user: created, isNew: true };
  }
}
