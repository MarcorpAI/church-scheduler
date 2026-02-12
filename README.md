# ServeFlow

Effortless church service scheduling and volunteer coordination.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Local/Neon) with Prisma ORM
- **Auth**: Auth.js (NextAuth v5) with Credentials provider
- **UI**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Notifications**: Polling-based real-time updates + Resend (email)

## Getting Started

### 1. Environment Setup

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/church_scheduler"
AUTH_SECRET="your-auth-secret" # Generate with: openssl rand -base64 32
RESEND_API_KEY="re_..." # Optional for local dev
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Migration

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

## Features

- [x] **Admin Dashboard**: Create and manage services.
- [x] **Task Assignment**: Assign volunteers to specific tasks within a service.
- [x] **Volunteer Portal**: View personal assignments and update task status.
- [x] **Real-time Notifications**: Get notified when assigned to a task or when status changes.
- [x] **Role-based Access**: Secure routes for Admins and Volunteers.

## Project Structure

- `app/`: Next.js pages and API routes.
- `components/`: Reusable UI components.
- `lib/`: Utility functions and shared instances (Prisma, Resend).
- `prisma/`: Database schema and migrations.
- `types/`: TypeScript definitions and module augmentations.
