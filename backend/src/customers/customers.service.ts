import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCustomerDto {
  @IsString() @IsOptional() companyName?: string;
  @IsString() @IsOptional() gstNumber?: string;
  @IsEnum(CustomerCategory) @IsOptional() category?: CustomerCategory;
  @IsString() @IsOptional() internalNotes?: string;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { user: { phone: { contains: search } } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
        bookings: {
          include: { service: { select: { name: true } }, payments: true },
          orderBy: { shootDate: 'desc' },
          take: 10,
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  // Total spent by a customer across all completed bookings
  async getStats(id: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { customerId: id },
      include: { payments: true },
    });

    const totalSpent = bookings
      .flatMap((b) => b.payments)
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.status === 'COMPLETED').length,
      totalSpent,
    };
  }
}
