import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as crypto from "crypto";
import Razorpay from "razorpay";
import {
  BookingStatus,
  PaymentMode,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { NotificationsService } from "../notifications/notifications.service";
import { SseService } from "../sse/sse.service";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { VerifyRazorpayDto } from "./dto/verify-razorpay.dto";

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private notifications: NotificationsService,
    private sse: SseService,
  ) {
    this.razorpay = new Razorpay({
      key_id: this.config.get<string>("RAZORPAY_KEY_ID"),
      key_secret: this.config.get<string>("RAZORPAY_KEY_SECRET"),
    });
  }

  async createRazorpayOrder(dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) throw new NotFoundException("Booking not found");

    // Never trust a client-supplied amount for a real charge  always derive
    // the amount due from the booking record itself.
    const amount = this.resolveExpectedAmount(booking, dto.type);

    const order = await this.razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `booking_${dto.bookingId}`,
    });

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount,
        type: dto.type,
        mode: PaymentMode.UPI,
        status: PaymentStatus.PENDING,
        razorpayOrderId: order.id as string,
      },
    });

    return {
      orderId: order.id,
      amount,
      currency: "INR",
      paymentId: payment.id,
      keyId: this.config.get<string>("RAZORPAY_KEY_ID"),
    };
  }

  // Source of truth for what a payment of a given type should cost
  // ignores whatever amount the client asked to be charged.
  private resolveExpectedAmount(
    booking: { totalAmount: any; advanceAmount: any },
    type: PaymentType,
  ): number {
    if (type === PaymentType.ADVANCE) return Number(booking.advanceAmount);
    if (type === PaymentType.FULL) return Number(booking.totalAmount);
    throw new BadRequestException("Unsupported payment type");
  }

  async verifyRazorpay(dto: VerifyRazorpayDto) {
    const expectedSignature = crypto
      .createHmac("sha256", this.config.get<string>("RAZORPAY_KEY_SECRET"))
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException(
        "Payment verification failed  invalid signature",
      );
    }

    const existing = await this.prisma.payment.findUnique({
      where: { id: dto.paymentDbId },
    });
    if (!existing) throw new NotFoundException("Payment record not found");
    if (existing.bookingId !== dto.bookingId)
      throw new BadRequestException("Payment does not belong to this booking");

    const payment = await this.prisma.payment.update({
      where: { id: dto.paymentDbId },
      data: {
        status: PaymentStatus.PAID,
        razorpayPaymentId: dto.razorpayPaymentId,
        paidAt: new Date(),
      },
    });

    await this.updateBookingStatusAfterPayment(dto.bookingId, payment.type);
    this.notifications
      .sendBookingNotification(dto.bookingId, "PAYMENT_RECEIVED")
      .catch(() => {});
    this.sse.emit({ type: "payment.confirmed", bookingId: dto.bookingId });

    return { success: true, payment };
  }

  async recordOfflinePayment(dto: CreatePaymentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) throw new NotFoundException("Booking not found");

    // Mirror the same allow-list the dashboard UI already restricts payment
    // entry to  otherwise a direct API call could force a REQUEST/CANCELLED
    // booking straight to COMPLETED, skipping quote/approval entirely.
    const allowedStatuses: BookingStatus[] = [
      BookingStatus.APPROVED,
      BookingStatus.ADVANCE_PAID,
      BookingStatus.IN_PROGRESS,
    ];
    if (!allowedStatuses.includes(booking.status)) {
      throw new BadRequestException(
        `Cannot record a payment for a booking in ${booking.status} status`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        amount: dto.amount,
        type: dto.type,
        mode: dto.mode,
        status: PaymentStatus.PAID,
        referenceNumber: dto.referenceNumber,
        collectedBy: dto.collectedBy,
        paidAt: new Date(),
      },
    });

    await this.updateBookingStatusAfterPayment(dto.bookingId, dto.type);
    this.notifications
      .sendBookingNotification(dto.bookingId, "PAYMENT_RECEIVED")
      .catch(() => {});
    this.sse.emit({ type: "payment.confirmed", bookingId: dto.bookingId });

    return payment;
  }

  async findByBooking(
    bookingId: string,
    requesterId: string,
    requesterRole: string,
  ) {
    // CUSTOMER can only view payments for their own bookings
    if (requesterRole === "CUSTOMER") {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: { select: { userId: true } } },
      });
      if (!booking) throw new NotFoundException("Booking not found");
      const owns =
        booking.createdById === requesterId ||
        booking.customer?.userId === requesterId;
      if (!owns) throw new ForbiddenException("Access denied");
    }
    return this.prisma.payment.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  }

  async handleWebhook(body: any, signature: string) {
    const webhookSecret = this.config.get<string>("RAZORPAY_WEBHOOK_SECRET");
    if (!webhookSecret || webhookSecret.includes("your_")) {
      throw new BadRequestException("Webhook not configured");
    }
    const expectedSig = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (expectedSig !== signature)
      throw new BadRequestException("Invalid webhook signature");

    if (body.event === "payment.captured") {
      const { order_id, id: paymentId } = body.payload.payment.entity;
      await this.prisma.payment.updateMany({
        where: { razorpayOrderId: order_id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.PAID,
          razorpayPaymentId: paymentId,
          paidAt: new Date(),
        },
      });
    }

    return { received: true };
  }

  private async updateBookingStatusAfterPayment(
    bookingId: string,
    paymentType: PaymentType,
  ) {
    if (paymentType === PaymentType.ADVANCE) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.ADVANCE_PAID },
      });
      await this.createCommissionIfNeeded(bookingId);
    } else if (paymentType === PaymentType.FULL) {
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      });
      await this.createCommissionIfNeeded(bookingId);
    }
  }

  // Auto-create pending commission when agent-referred booking gets advance payment
  private async createCommissionIfNeeded(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { agent: true },
    });

    if (!booking?.agentId || !booking.agent) return;

    // Skip if commission already exists for this booking
    const existing = await this.prisma.commission.findFirst({
      where: { bookingId },
    });
    if (existing) return;

    const commissionAmount =
      (Number(booking.totalAmount ?? 0) *
        Number(booking.agent.commissionRate)) /
      100;

    await this.prisma.commission.create({
      data: {
        bookingId,
        agentId: booking.agentId,
        bookingAmount: booking.totalAmount ?? 0,
        commissionRate: booking.agent.commissionRate,
        commissionAmount: commissionAmount,
        status: "PENDING",
      },
    });
  }
}
