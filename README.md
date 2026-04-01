# Zorvyn Finance Data Processing and Access Control Backend

[![Node.js](https://img.shields.io/badge/Node.js-22-2f855a?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5-111827?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-1f2937?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-1d4ed8?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-2563eb?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Please review the `zorvyn-finance-dashboard` branch for this submission.

Backend solution for a finance dashboard system with role-based access control, financial record management, and dashboard summary APIs.

Public API documentation:
`https://siddhaarthaa.github.io/OpenLedger/`

## What Is Implemented

- user management with role and status fields
- roles: `VIEWER`, `ANALYST`, `ADMIN`
- financial record CRUD
- filtering by date, category, type, and search
- dashboard summary and trend APIs
- backend-level role-based access control
- session-based authentication
- PostgreSQL persistence with Prisma

## Stack

- Node.js
- Express
- Prisma
- PostgreSQL
- TypeScript

## Access Model

- `VIEWER`
  Can access dashboard summary and trend endpoints.
- `ANALYST`
  Can read financial records and dashboard data.
- `ADMIN`
  Can manage users and perform full financial record CRUD.

Users also have a `status` field:

- `ACTIVE`
  Account can authenticate and use permitted routes.
- `INACTIVE`
  Account access is blocked without deleting the user.

## Data Model

![Prisma schema diagram](./prisma_schema_design.png)

Core entities:

- `User`
- `AuthAccount`
- `Session`
- `FinancialRecord`

## API Overview

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`

### Users

- `GET /api/users/me`
- `GET /api/users` admin only
- `POST /api/users` admin only
- `PATCH /api/users/:userId` admin only

### Records

- `GET /api/records` admin and analyst
- `GET /api/records/:recordId` admin and analyst
- `POST /api/records` admin only
- `PATCH /api/records/:recordId` admin only
- `DELETE /api/records/:recordId` admin only

Supported filters on `GET /api/records`:

- `type`
- `category`
- `from`
- `to`
- `search`
- `page`
- `pageSize`

### Dashboard

- `GET /api/dashboard/summary`
- `GET /api/dashboard/trends?period=monthly|weekly`

Supported filters:

- `type`
- `category`
- `from`
- `to`
- `search`

## Key Rules

- only admins can create or manage users
- only admins can create, update, or delete financial records
- analysts can read records but cannot modify them
- viewers are limited to dashboard endpoints
- inactive users cannot authenticate or access protected routes
- the last active admin cannot be removed or deactivated

## Local Setup

```bash
docker compose up -d
npm install
npm --workspace backend/shared/db run prisma:generate
npm --workspace backend/shared/db run prisma:migrate
npm --workspace backend/api run dev
```

The API runs on `http://localhost:4000`.

Environment file examples:

- [`.env.example`](/home/sid/work/OpenLedger/.env.example)
- [`backend/shared/db/.env.example`](/home/sid/work/OpenLedger/backend/shared/db/.env.example)

## Example Requests

Create a user:

```bash
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -b "session_id=YOUR_ADMIN_SESSION" \
  -d '{
    "email": "analyst@example.com",
    "password": "strongpass123",
    "name": "Finance Analyst",
    "role": "ANALYST",
    "status": "ACTIVE"
  }'
```

Create a financial record:

```bash
curl -X POST http://localhost:4000/api/records \
  -H "Content-Type: application/json" \
  -b "session_id=YOUR_ADMIN_SESSION" \
  -d '{
    "amount": "125000",
    "type": "INCOME",
    "category": "Consulting",
    "entryDate": "2026-04-01T00:00:00.000Z",
    "notes": "April consulting invoice"
  }'
```

Fetch dashboard summary:

```bash
curl http://localhost:4000/api/dashboard/summary?from=2026-01-01&to=2026-12-31 \
  -b "session_id=YOUR_SESSION"
```

## Verification

Verified locally:

- `npm --workspace backend/shared/db run prisma:generate`
- `npm --workspace backend/shared/db run prisma:migrate`
- `npm --workspace backend/api run build`
