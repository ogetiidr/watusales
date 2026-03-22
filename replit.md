# Workspace

## Overview

Agent & Device Management System (ADMS) — A full-stack pnpm workspace monorepo. Multi-role management system with Admin, Team Leader, and Agent roles.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Wouter (routing), TanStack React Query, shadcn/ui, Tailwind CSS

## Default Login Credentials

- **Admin**: `admin` / `admin123`
- **Team Leader**: `leader1` / `leader123`
- **Agent**: `agent1` / `agent123`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── adms/               # React + Vite frontend (Agent & Device Management System)
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

### Authentication
- Session-based auth via `express-session` with httpOnly cookies
- Role-based access control: Admin, Leader, Agent
- Password hashing with Node.js PBKDF2 (no external bcrypt needed)

### Admin Role
- Dashboard with stats (total leaders, agents, devices, today's sales, top agent)
- Manage team leaders (add/edit/delete)
- Manage agents (suspend/activate, delete, move between leaders)
- Manage devices (view all, delete, move)
- IMEI blacklist management
- Performance rankings (daily + weekly)
- System activity logs
- Password resets for any user

### Team Leader Role
- Dashboard with team stats
- Manage own agents (add/edit/delete)
- Manage team devices (assign, move between agents)
- Approval center (approve/reject delete and transfer requests)
- Team performance rankings

### Agent Role
- Dashboard with personal stats (devices, today/weekly sales, rank)
- Add device by IMEI (with duplicate/blacklist check)
- View own devices
- Submit delete/transfer requests
- Search device by IMEI

### Device Management
- IMEI uniqueness enforced globally
- IMEI blacklist prevents adding/transferring blacklisted devices
- Status tracking: active, pending, removed, blacklisted

### Performance System
- Daily rankings (devices added today)
- Weekly rankings (Monday-Sunday, finalized on Sunday)

## Database Schema

- `users` — all users (admin/leader/agent) with role, status, leader_id
- `devices` — IMEI, agent_id, leader_id, status, date_added
- `requests` — delete/transfer requests with status and rejection reason
- `logs` — activity log for all system actions
- `blacklist` — blacklisted IMEIs
- `notifications` — per-user in-app notifications

## API Endpoints

All under `/api`:
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/change-password`
- `GET/POST /users`, `GET/PUT/DELETE /users/:id`, `/users/:id/status`, `/users/:id/reset-password`, `/users/:id/move-agent`
- `GET/POST /devices`, `GET/DELETE /devices/:id`, `GET /devices/search`, `PUT /devices/:id/move`, `PUT /devices/:id/assign`
- `GET/POST /blacklist`, `DELETE /blacklist/:id`
- `GET/POST /requests`, `PUT /requests/:id/approve`, `PUT /requests/:id/reject`
- `GET /performance/daily`, `GET /performance/weekly`
- `GET /logs`
- `GET /notifications`, `PUT /notifications/:id/read`
- `GET /dashboard/admin`, `GET /dashboard/leader`, `GET /dashboard/agent`
