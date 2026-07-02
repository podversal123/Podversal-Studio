# Podversal Studio Management Platform

## Recent Updates (Pre-Launch Final Pass)

- Fixed CORS so `www.podversal.com` (and all origins) can reach the API
- Restored missing blog post; fixed blog cover images and card design
- Removed mobile OTP login everywhere (staff login + backend endpoints); email/password + Google only
- Made the landing page hero fully responsive (bold on phone/tablet, compact on desktop, detected via touch vs. mouse input rather than screen width)
- Fixed low-contrast text across the site in both dark and light mode
- Fixed excessive spacing gaps between sections on the landing, pricing, about, our-work, and service detail pages
- Wiped test data from production (bookings, payments, invoices, test accounts) — Super Admin login and all content untouched
- Added an automated daily database backup (3 AM) to Cloudinary + email, with a manual "Run Backup Now" button in Settings
- Hid the "Add Employee" button from Studio Managers (create is Super Admin only, matching backend permissions)
- Changed the payment-confirmation customer email to read "Booking Confirmed" instead of "Payment Confirmed"
- Added delivery-failure alerts: if a customer notification email fails to send, it's now logged and the admin is emailed instead of failing silently
- Updated the About Us page with the company's official intro, mission, and vision copy

## Project Structure

```
podversal/
├── backend/         # NestJS API (Port 3001)
│   ├── src/
│   │   ├── auth/           # Login - JWT, Google
│   │   ├── users/          # All 5 user types
│   │   ├── bookings/       # Core booking system
│   │   ├── services/       # 6 studio services
│   │   ├── payments/       # Razorpay + cash/bank
│   │   ├── invoices/       # GST, Quotation, Receipt PDFs
│   │   ├── agents/         # Referral agents + commissions
│   │   ├── customers/      # CRM
│   │   ├── employees/      # Staff management
│   │   ├── calendar/       # Scheduling + availability
│   │   ├── dashboard/      # KPIs and analytics
│   │   ├── reports/        # PDF reports
│   │   ├── notifications/  # Email notifications
│   │   ├── prisma/         # Database service
│   │   └── common/         # Guards, decorators, filters
│   └── prisma/
│       └── schema.prisma   # All database models
│
└── frontend/        # Next.js 14 (Port 3000)
    └── src/
        ├── app/            # Next.js App Router pages
        ├── components/     # Reusable UI components
        ├── lib/            # API client, utilities
        └── types/          # TypeScript types
```

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run start:dev
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Fill in all values in .env.local
npm install
npm run dev
```

### 3. Services Needed Locally
- PostgreSQL running on port 5432
- Redis running on port 6379

## Tech Stack
- Frontend: Next.js 14, React, Tailwind CSS, Framer Motion
- Backend: Node.js, NestJS, TypeScript
- Database: PostgreSQL + Prisma ORM
- Cache: Redis (slot locking)
- Storage: Cloudinary
- Payments: Razorpay
- Auth: JWT + Google OAuth
