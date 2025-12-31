# FitSense Fitness Hub - Next.js Migration

## Overview

This is the **unified Next.js application** that combines the React frontend and NestJS backend into a single deployable application. The migration maintains **100% API and feature parity** with the original implementation.

## Architecture

### Before (Original)
```
┌─────────────────┐     ┌─────────────────┐
│  React + Vite   │────▶│  NestJS + Prisma │
│  Frontend       │     │  Backend         │
└─────────────────┘     └─────────────────┘
        ↓                       ↓
   Vercel Static            Vercel Node
```

### After (Unified)
```
┌─────────────────────────────────────────┐
│           Next.js 15 App                │
│  ┌────────────────┬──────────────────┐  │
│  │  React 19      │  API Routes      │  │
│  │  App Router    │  (Edge/Node)     │  │
│  └────────────────┴──────────────────┘  │
└─────────────────────────────────────────┘
                    ↓
              Vercel Unified
```

## Tech Stack

| Component | Original | Migrated |
|-----------|----------|----------|
| Framework | React + NestJS | Next.js 15 |
| Routing | react-router-dom | Next.js App Router |
| Database | Prisma ORM | pg (direct SQL) |
| Auth | @nestjs/jwt | jose |
| Email | @getbrevo/brevo | nodemailer |
| AI | @google/generative-ai | @google/generative-ai |
| Styling | Tailwind CSS | Tailwind CSS |
| Animation | framer-motion | framer-motion |
| Charts | recharts | recharts |

## Project Structure

```
fitsense-nextjs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/v1/             # API Routes (mirrors NestJS)
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── users/          # User management
│   │   │   ├── membership/     # Memberships & plans
│   │   │   ├── attendance/     # Check-in/out
│   │   │   ├── workouts/       # Workout plans
│   │   │   ├── diets/          # Diet plans
│   │   │   ├── notifications/  # In-app notifications
│   │   │   ├── reports/        # Admin analytics
│   │   │   └── cron/           # Vercel cron jobs
│   │   ├── app/                # Protected app routes
│   │   ├── login/              # Auth pages
│   │   ├── register/
│   │   └── landing/            # Public marketing
│   ├── components/
│   │   ├── ui/                 # Shared components
│   │   └── layouts/            # App & Website layouts
│   └── lib/
│       ├── db.ts               # PostgreSQL connection
│       ├── auth.ts             # JWT utilities (jose)
│       ├── email.ts            # Email service
│       ├── ai.ts               # Gemini AI service
│       ├── auth-context.tsx    # Client auth state
│       └── api-client.ts       # Frontend API client
├── public/                     # Static assets
├── vercel.json                 # Cron job configs
└── package.json
```

## API Endpoints

All endpoints are prefixed with `/api/v1/` and maintain exact parity with the original NestJS API:

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/logout` - Logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users
- `GET /users` - List users (admin)
- `GET /users/profile` - Get current user
- `PUT /users/profile` - Update profile
- `POST /users/change-password` - Change password
- `GET /users/:id` - Get user by ID (admin)
- `PUT /users/:id` - Update user (admin)
- `DELETE /users/:id` - Delete user (admin)
- `POST /users/:id/block` - Block user (admin)
- `POST /users/:id/unblock` - Unblock user (admin)

### Memberships & Plans
- `GET /membership` - List memberships (admin)
- `GET /membership/my-membership` - Get current membership
- `POST /membership/assign` - Assign membership (admin)
- `POST /membership/:id/cancel` - Cancel membership
- `GET /membership/plans` - List plans
- `POST /membership/plans` - Create plan (admin)
- `GET /membership/plans/:id` - Get plan
- `PUT /membership/plans/:id` - Update plan (admin)
- `DELETE /membership/plans/:id` - Delete plan (admin)

### Attendance
- `GET /attendance` - List attendance (admin)
- `POST /attendance/check-in` - Check in
- `POST /attendance/check-out` - Check out
- `GET /attendance/my-history` - User attendance history
- `GET /attendance/date/:date` - Attendance by date (admin)
- `GET /attendance/absent/:days` - Absent members (admin)

### Workouts
- `GET /workouts` - List workouts
- `POST /workouts` - Create workout
- `GET /workouts/my-workouts` - User workouts
- `POST /workouts/generate-ai` - AI generation
- `POST /workouts/assign` - Assign workout (admin)
- `GET /workouts/:id` - Get workout
- `DELETE /workouts/:id` - Delete workout

### Diets
- `GET /diets` - List diets
- `POST /diets` - Create diet
- `GET /diets/my-diets` - User diets
- `POST /diets/generate-ai` - AI generation
- `POST /diets/assign` - Assign diet (admin)
- `GET /diets/:id` - Get diet
- `DELETE /diets/:id` - Delete diet

### Notifications
- `GET /notifications` - List notifications
- `GET /notifications/unread-count` - Unread count
- `POST /notifications/mark-all-read` - Mark all read
- `POST /notifications/:id/mark-read` - Mark one read
- `DELETE /notifications/:id` - Delete notification

### Reports (Admin)
- `GET /reports/dashboard` - Dashboard stats
- `GET /reports/attendance` - Attendance report
- `GET /reports/membership` - Membership report
- `GET /reports/revenue` - Revenue report
- `GET /reports/user-activity/:userId` - User activity
- `GET /reports/top-active-members` - Top members

### Cron Jobs (Vercel)
- `GET /cron/expire-memberships` - Daily at midnight
- `GET /cron/expiry-reminders` - Daily at 9 AM
- `GET /cron/absence-notifications` - Daily at 10 AM
- `GET /cron/cleanup-tokens` - Daily at 3 AM

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Database Setup
Run the existing Prisma migrations against your PostgreSQL database, or use the same database as your existing backend.

### 4. Run Development
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

## Deployment (Vercel)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

Cron jobs are automatically configured via `vercel.json`.

## Key Differences from Original

### Database Access
- **Original**: Prisma ORM with type-safe queries
- **Migrated**: Direct `pg` package for serverless optimization

### Authentication
- **Original**: `@nestjs/jwt` with decorators
- **Migrated**: `jose` library with middleware helpers

### Email Service
- **Original**: Brevo SDK with API
- **Migrated**: Nodemailer with SMTP (compatible with any SMTP provider)

### API Structure
- **Original**: NestJS controllers with decorators
- **Migrated**: Next.js Route Handlers with helper functions

## Migration Checklist

- [x] Project setup (package.json, configs)
- [x] Core libraries (db, auth, email, ai)
- [x] Auth API routes (6 endpoints)
- [x] Users API routes (9 endpoints)
- [x] Membership API routes (9 endpoints)
- [x] Attendance API routes (6 endpoints)
- [x] Workout API routes (6 endpoints)
- [x] Diet API routes (6 endpoints)
- [x] Notification API routes (5 endpoints)
- [x] Reports API routes (6 endpoints)
- [x] Cron job routes (4 jobs)
- [x] UI Components (GlassCard, GlassButton, GlassInput, Logo)
- [x] Layouts (AppLayout, WebsiteLayout)
- [x] Auth pages (Login, Register)
- [x] Landing page
- [x] Home page
- [ ] All remaining app pages (workout, diet, profile, admin, etc.)

## License

Private - FitSense Fitness Hub
