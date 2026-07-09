# Vexor OS — System Architecture

## 1. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │   Next.js App (Vercel)      │
                        │   React + TS + Tailwind +   │
                        │   shadcn/ui                 │
                        └─────────────┬───────────────┘
                                      │ HTTPS (REST + WebSocket)
                        ┌─────────────▼───────────────┐
                        │   NestJS API Gateway        │
                        │   Auth Guards · RBAC ·      │
                        │   Rate Limiting · Zod DTOs  │
                        └──┬───────┬───────┬──────────┘
                           │       │       │
              ┌────────────▼─┐  ┌──▼────┐  ▼──────────────┐
              │ PostgreSQL   │  │ Redis │  │ BullMQ Workers│
              │ (Prisma)     │  │ cache │  │ email · autom.│
              └──────────────┘  │ + pub │  │ monitoring ·  │
                                │  /sub │  │ payroll · AI  │
                                └───────┘  └───────┬───────┘
                                                   │
              ┌──────────────┐  ┌────────────┐  ┌──▼─────────────┐
              │ Meilisearch  │  │ S3 Storage │  │ 3rd parties:   │
              │ (search)     │  │ (files)    │  │ Stripe·Razorpay│
              └──────────────┘  └────────────┘  │ Resend·WhatsApp│
                                                └────────────────┘
```

## 2. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind, shadcn/ui | SSR + streaming, design-system velocity |
| Backend | NestJS (modular monolith) | Clean architecture, DI, testability; extractable to services later |
| DB | PostgreSQL + Prisma | Relational integrity, migrations, type safety |
| Cache/Realtime backbone | Redis (cache, pub/sub, rate limits, Socket.IO adapter) | Single dependency, many roles |
| Queue | BullMQ | Automation runs, emails, monitoring probes, payroll, AI jobs |
| Search | Meilisearch | Instant search for leads, tickets, KB, tasks |
| Storage | S3-compatible | Files, contracts, deliverables, salary slips |
| Auth | Auth.js (frontend session) + NestJS JWT issuance | OAuth (Google), 2FA TOTP, refresh rotation |
| Realtime | Socket.IO (Redis adapter) | Dashboard, notifications, chat, boards |
| Payments | Stripe + Razorpay | Global + India coverage, payment links, webhooks |
| Email | Resend | Transactional + tracking pixels/links |
| Deploy | Docker, GitHub Actions/GitLab CI, Vercel (web), Railway/AWS (api+workers) | Reproducible, automated |

## 3. Monorepo Layout

```
vexor/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/              # App Router routes (dashboard, crm, projects, ...)
│   │   ├── components/       # Feature components
│   │   ├── lib/              # API client, socket client, utils
│   │   └── e2e/              # Playwright tests
│   ├── api/                  # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/      # One folder per domain module
│   │   │   │   ├── auth/
│   │   │   │   ├── org/
│   │   │   │   ├── crm/
│   │   │   │   ├── lead-distribution/
│   │   │   │   ├── projects/
│   │   │   │   ├── tasks/
│   │   │   │   ├── finance/
│   │   │   │   ├── hrms/
│   │   │   │   ├── support/
│   │   │   │   ├── monitoring/
│   │   │   │   ├── marketing/
│   │   │   │   ├── knowledge-base/
│   │   │   │   ├── calendar/
│   │   │   │   ├── notifications/
│   │   │   │   ├── ai/
│   │   │   │   ├── automation/
│   │   │   │   ├── reports/
│   │   │   │   └── settings/
│   │   │   ├── common/       # Guards, decorators, interceptors, filters
│   │   │   ├── infra/        # Prisma, Redis, S3, Meilisearch, mail, payments
│   │   │   └── main.ts
│   │   └── test/             # Integration tests
│   └── workers/              # BullMQ processors (automation, monitoring, mail)
├── packages/
│   ├── ui/                   # Shared shadcn-based component library
│   ├── schemas/              # Zod schemas shared FE/BE (single source of validation)
│   ├── permissions/          # RBAC matrix: resources, actions, role presets
│   └── config/               # ESLint, TS, Tailwind presets
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docker/                   # Dockerfiles + compose for local stack
├── docs/                     # PRD, architecture, ADRs, module docs, API reference
└── .gitlab-ci.yml            # lint → typecheck → test → build → deploy
```

Each NestJS module follows clean architecture internally:
`controller (HTTP) → service (use cases) → repository (Prisma) → entities`, with DTO validation at the boundary via shared Zod schemas.

## 4. Multi-Tenancy & RBAC

- Every tenant table carries `org_id`; Prisma client extension injects `org_id` filters automatically so cross-tenant leakage is structurally impossible.
- Client users additionally scoped by `client_id` on every query touching client-visible resources.
- Permission model: `Permission = resource:action` → `Role` presets → `UserRole` (+ per-user overrides). Enforced by a NestJS `@RequirePermission()` guard and mirrored in the frontend for UI gating.
- Super Admin operates above orgs via a separate guard path with full audit logging.

## 5. Real-Time Design

- Domain events (e.g., `lead.created`, `invoice.paid`, `task.moved`) published to Redis pub/sub.
- Socket.IO gateway fans out to rooms: `org:{id}`, `user:{id}`, `project:{id}`, `client:{id}`.
- Dashboard aggregates cached in Redis, invalidated by the same events → sub-second updates.

## 6. Automation Engine

- Workflows stored as a directed graph (nodes: trigger, action, condition, delay; edges: transitions).
- Trigger events enqueue a workflow run in BullMQ; each node executes as a job step with retry/backoff; run history persisted per execution for debugging.
- Visual builder (React Flow) serializes to the same graph schema (shared Zod).

## 7. AI Assistant

- Tool-based agent over internal APIs: every AI data access goes through the same RBAC-guarded service layer as human users — the assistant can never see more than the asking user.
- Capabilities implemented as typed tools: `queryProjects`, `queryWorkload`, `generateProposal`, `generateInvoiceDraft`, `draftEmail`, `summarizeMeeting`, `estimateCost`, `predictDelay`, `recommendAssignee`, `analyzeRevenue`, `buildReport`.
- Long generations run as BullMQ jobs streaming results over Socket.IO.

## 8. Website Monitoring

- Scheduled BullMQ repeatable jobs per monitored site: HTTP probe (uptime, latency), TLS cert check, WHOIS domain expiry, DNS resolution, Lighthouse run (containerized), backup-status webhook intake.
- Threshold breaches raise alerts through the Notifications module.

## 9. Security

- JWT (15 min) + rotating refresh tokens (httpOnly, revocable), OAuth (Google), TOTP 2FA.
- Rate limiting (Redis sliding window) per IP + per user.
- Column-level encryption for salaries, bank details, API secrets.
- Immutable audit log (append-only table) for auth events, permission changes, finance operations, data exports.
- GDPR: per-user data export job, cascade anonymization on deletion request.

## 10. Testing Strategy

- **Unit:** services + pure logic (Vitest/Jest), permissions matrix fully covered.
- **Integration:** API endpoints against Postgres testcontainers, per module.
- **E2E:** Playwright critical journeys (login, lead→deal, invoice→payment, ticket lifecycle).
- CI gates: lint, typecheck, tests, build must pass before merge.

## 11. Deployment

- Docker images for api + workers; docker-compose for local (Postgres, Redis, Meilisearch, MinIO, Mailpit).
- CI pipeline: lint → typecheck → test → build → deploy (web → Vercel, api/workers → Railway or AWS ECS).
- Environments: local → staging → production, with Prisma migrations applied on deploy.
