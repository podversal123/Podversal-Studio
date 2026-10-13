-- CreateEnum
CREATE TYPE "FounderBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "founder_bookings" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "referredBy" TEXT NOT NULL,
    "shootDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "status" "FounderBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confirmationSentAt" TIMESTAMP(3),
    "reminderDaySentAt" TIMESTAMP(3),
    "reminderHourSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "founder_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "founder_bookings_bookingCode_key" ON "founder_bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "founder_bookings_shootDate_idx" ON "founder_bookings"("shootDate");

-- CreateIndex
CREATE INDEX "founder_bookings_status_idx" ON "founder_bookings"("status");

-- CreateIndex
CREATE INDEX "founder_bookings_referredBy_idx" ON "founder_bookings"("referredBy");

-- Hard guarantee against double-booking a founder slot (cancelled bookings free the slot).
-- Hand-written: Prisma schema can't express partial unique indexes.
CREATE UNIQUE INDEX "founder_bookings_active_slot_key"
    ON "founder_bookings"("shootDate", "startTime")
    WHERE "status" <> 'CANCELLED';
