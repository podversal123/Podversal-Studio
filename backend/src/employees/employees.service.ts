import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

export class CreateEmployeeDto {
  @IsString() name: string;
  @IsString() email: string;
  @IsString() @IsOptional() password?: string;
  @IsString() jobTitle: string;
  @IsString() shiftStart: string; // "09:00"
  @IsString() shiftEnd: string;   // "18:00"
  @IsString() @IsOptional() phone?: string;
}

export class UpdateEmployeeDto {
  @IsString() @IsOptional() jobTitle?: string;
  @IsString() @IsOptional() shiftStart?: string;
  @IsString() @IsOptional() shiftEnd?: string;
}

@Injectable()
export class EmployeesService {
  constructor(
    private prisma: PrismaService,
    private users: UsersService,
  ) {}

  findAll() {
    return this.prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        bookings: {
          include: { service: { select: { name: true } } },
          orderBy: { shootDate: 'desc' },
          take: 10,
        },
      },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email already registered');

    const user = await this.users.create({
      name:     dto.name,
      email:    dto.email,
      phone:    dto.phone,
      password: dto.password,
      role:     Role.EMPLOYEE,
    });

    return this.prisma.employee.create({
      data: {
        userId:     user.id,
        jobTitle:   dto.jobTitle,
        shiftStart: dto.shiftStart,
        shiftEnd:   dto.shiftEnd,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.employee.update({ where: { id }, data: { isActive: false } });
  }

  // Bookings assigned to an employee for a given date
  async getSchedule(id: string, date: string) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    return this.prisma.booking.findMany({
      where: {
        employeeId: id,
        shootDate: { gte: start, lt: end },
        status: { notIn: ['CANCELLED'] },
      },
      include: { service: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    });
  }
}
