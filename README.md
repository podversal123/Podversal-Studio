# Podversal Studio Management Platform

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
