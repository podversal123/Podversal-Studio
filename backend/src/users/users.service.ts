import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
  }) {
    // Return existing user if already linked to this Google account
    let user = await this.findByGoogleId(profile.googleId);
    if (user) return user;

    // If email exists, link the Google account to it
    user = await this.findByEmail(profile.email);
    if (user) {
      return this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.googleId },
      });
    }

    // Brand new user via Google
    return this.create({
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      role: Role.CUSTOMER,
    });
  }
}
