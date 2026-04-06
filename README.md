# Finance Data Processing And Access Control Backend— Full Stack

Express.js + Prisma (SQLite) API with role-based access control, plus a React (Vite) dashboard for demos and a **single deployable URL** (API + static UI).

## Features implemented

- [x] **User and role management** — Register and log in (JWT); registration includes choosing **Viewer / Analyst / Admin**; admins create/update/delete users, assign roles, set ACTIVE/INACTIVE status.
- [x] **Financial records CRUD** — Create, read, update, and soft-delete records (Analyst & Admin); viewers see dashboard-only aggregates.
- [x] **Record filtering** — List endpoint supports filters by **date range**, **category**, **type** (income/expense), plus search and pagination.
- [x] **Dashboard summary APIs** — Totals (income, expense, net), category breakdown, recent activity, weekly/monthly **trends**; optional date range query params.
- [x] **Role-based access control** — Enforced in middleware on routes (viewer vs analyst vs admin capabilities).
- [x] **Input validation and error handling** — Zod schemas, consistent JSON errors, appropriate HTTP status codes, centralized error handler.
- [x] **Data persistence (database)** — Prisma ORM with **SQLite** (file DB); schema in `prisma/schema.prisma` (switchable to Postgres for production).

## Roles (backend enforced)

| Role    | Dashboard & summaries | Records (CRUD) | User management |
|--------|------------------------|----------------|-----------------|
| VIEWER | Yes                   | No             | No              |
| ANALYST| Yes                   | Yes            | No              |
| ADMIN  | Yes                   | Yes            | Yes             |

## How It Works
Viewers: Read-only access to all records and analytics
Analysts: Can create and edit their own records, view all data
Admins: Full access to everything, including user management

Inactive users cannot log in; JWTs are rejected for inactive accounts.

## Local setup

**Requirements:** Node.js 18+

1. Copy environment files:

   ```bash
   copy .env.example .env
   ```

2. Install and prepare the database:

   ```bash
   npm install
   npx prisma db push
   ```

   Optional: `npm run db:seed` adds sample users and transactions for local testing only.

3. **Option A — developing UI and API together**

   - Terminal 1: `npm run dev` (API on [http://localhost:3000](http://localhost:3000))
   - Terminal 2: `npm run dev:web` (Vite on [http://localhost:5173](http://localhost:5173); `/api` is proxied to port 3000)

4. **Option B — production-style (one server)**

   ```bash
   npm run build
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000) — the API and built SPA share the same origin.

## Sign up and log in

- **Create account** (`/register`): choose **Viewer**, **Analyst**, or **Admin** (per assignment definitions), then register with name, email, and password (minimum 8 characters). Admins can still change roles later under **Users**.
- **Log in** (`/login`): use the same email and password you registered with.

## API overview

- `POST /api/auth/register` — JSON `{ "email", "password", "name", "role": "VIEWER" | "ANALYST" | "ADMIN" }` → `{ token, user }` (201)
- `POST /api/auth/login` — JSON `{ "email", "password" }` → `{ token, user }`
- `GET /api/auth/me` — Bearer JWT → current user
- `GET|POST|PATCH|DELETE /api/users` — **ADMIN** (user CRUD)
- `GET|POST|PATCH|DELETE /api/records` — **ANALYST** & **ADMIN** (list supports filters, pagination, search)
- `GET /api/dashboard/summary|recent|trends` — all authenticated roles (**VIEWER** included)

Errors return JSON `{ error, code }` with appropriate HTTP status codes; validation failures include Zod `details`.

## “Live link” deployment

Deploy **one** Node service that runs `npm start` after a build step.

**Suggested `render.com` (Web Service) settings**

- **Build command:** `npm install && npx prisma migrate deploy && npm run build`  
  (First time with SQLite file DB works; for production persistence, switch `DATABASE_URL` to a hosted Postgres and run `npx prisma migrate dev` locally to create SQL migrations, then commit `prisma/migrations`.)
- **Start command:** `npm start`
- **Environment:** `JWT_SECRET`, `DATABASE_URL`, `PORT` (Render sets `PORT` automatically)


## Assumptions

- Financial records are **company-wide** (not per-user isolation); `createdBy` is audit metadata.
- Record deletes are **soft** (`deletedAt`); list/detail omit soft-deleted rows.
- Currency display in the UI is USD formatting for presentation only; amounts are stored as decimals.

## Project layout

- `src/` — Express app, routes, services, RBAC middleware, Zod validators
- `prisma/` — schema, seed
- `frontend/` — Vite + React dashboard 

## Live Deployment 
- API Base URL: https://finance-data-processing-ochre.vercel.app/
