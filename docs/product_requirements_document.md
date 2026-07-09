# Vexor OS — Product Requirements Document

**Company:** Vexor IT Solutions
**Product:** Vexor OS
**Status:** Approved — v1.0

## 1. Vision

An AI-powered Business Operating System for software agencies and IT companies that replaces CRM, Project Management, HRMS, Finance, Marketing, Client Portal, Employee Portal, Helpdesk, Website Monitoring, and Business Analytics with a single, unified platform.

## 2. Roles (RBAC)

| Role | Scope |
|---|---|
| Super Admin | Platform-level control across all organizations |
| Founder | Full org access, executive dashboards, financial visibility |
| Admin | Org configuration, users, permissions, integrations |
| HR | HRMS, attendance, payroll, recruitment, documents |
| Sales Manager | CRM oversight, lead distribution rules, pipeline analytics |
| Sales Executive | Assigned leads, pipeline stages, follow-ups |
| Project Manager | Projects, sprints, resources, budgets, risk |
| Developer | Assigned tasks, time tracking, sprint boards |
| Designer | Assigned tasks, deliverables, feedback loops |
| Marketing Executive | Campaigns, content calendar, attribution |
| Finance Manager | Invoices, expenses, payroll, reports, GST |
| Client | Own projects, invoices, tickets, files, approvals only |

Permissions are resource + action based (`resource:action`, e.g. `invoice:read`, `lead:assign`), grouped into role presets, overridable per user. Multi-tenant isolation is enforced at the database row level (`org_id` on every tenant table) and at the API layer via guards.

## 3. Modules

### 3.1 Authentication
- Email/password + Google OAuth (Auth.js), JWT access + rotating refresh tokens, 2FA (TOTP), session management, device list, password policies, invite-based onboarding.

### 3.2 Organization Management
- Org profile, branding, departments, teams, working hours, fiscal year, currencies, tax config (GST), integrations, feature flags.

### 3.3 Employee Portal
- Attendance (check-in/out, geo/IP note), tasks, projects, time tracking, meetings, performance, leave, documents, salary slips, notifications, messages, activity history, leaderboard, achievements.

### 3.4 Client Portal
- Secure per-client login. Visibility: own projects, invoices, payments, contracts, files, tickets, progress, timeline, deliverables, meetings, messages, approvals, feedback, analytics. Hard tenant + client scoping: a client can never access another client's data.

### 3.5 CRM
- Unlimited leads, lead scoring (rule + AI), assignment, pipeline stages, meeting scheduler, proposal generator, email tracking (open/click), call logs, WhatsApp activity log, full lead timeline, follow-up reminders, conversion analytics, duplicate detection (email/phone fuzzy match), CSV import/export.

### 3.6 Lead Distribution Engine
- Strategies: manual, automatic, round robin, skill-based, location-based, workload-based, priority-based, AI recommendation. Ownership transfer and reassignment with audit trail.

### 3.7 Sales Pipeline
- Configurable stages, weighted forecasting, stage SLAs, win/loss reasons, deal value tracking.

### 3.8 Marketing Management
- Campaigns across Instagram, LinkedIn, Facebook, YouTube, Email, WhatsApp, SEO. Content calendar, social scheduler, lead attribution, UTM tracking, ROI analytics, campaign reports.

### 3.9 Project Management
- Views: Kanban, List, Timeline (Gantt), Calendar, Sprint. Milestones, dependencies, checklists, comments, files, time tracking, budget vs actual, progress %, risk register, deliverables, resource allocation, project health score (schedule + budget + risk composite).

### 3.10 Task Management
- Assignment, priorities, labels, subtasks, recurring tasks, watchers, mentions, activity feed.

### 3.11 Finance
- Invoices (one-off + recurring), expenses, GST handling, payroll integration, revenue, cash flow, profit, payment links (Razorpay + Stripe), receipts, refunds, financial reports.

### 3.12 HRMS
- Attendance, leave (policies, balances, approvals), payroll runs, recruitment pipeline, performance reviews, asset tracking, employee documents, holiday calendar, announcements.

### 3.13 Support Desk
- Tickets with categories, priorities, SLA policies with breach alerts, internal notes, canned responses, email-to-ticket, live chat, knowledge base linkage, ticket analytics.

### 3.14 Website Monitoring
- Per client website: uptime/downtime, response time, SSL expiry, domain expiry, DNS checks, hosting metadata, backup status, Lighthouse/SEO scores, automatic alerts (email/in-app/WhatsApp).

### 3.15 Knowledge Base
- Internal + client-facing articles, categories, versioning, search (Meilisearch).

### 3.16 Calendar
- Unified org/team/personal calendars, meeting scheduling, reminders, external calendar sync (ICS).

### 3.17 Notifications
- Channels: Email, SMS, WhatsApp, Push, Desktop, In-App. Role-based routing, per-user preferences, digest mode.

### 3.18 AI Assistant
- Permission-aware business AI. Capabilities: delayed-project detection, workload analysis, proposal/invoice/contract generation, follow-up email drafting, meeting summaries, project cost estimation, delay prediction, assignment recommendation, revenue analysis, report generation. All answers scoped to the requesting user's RBAC permissions.

### 3.19 Reports
- Revenue, profit, lead funnel, sales, projects, employees, marketing, finance, clients, website health, support, attendance, time tracking, forecasting, custom report builder. Export: CSV/PDF.

### 3.20 Automation Engine
- Visual drag-and-drop workflow builder. Triggers (e.g., Lead Created), actions (assign, email, schedule follow-up, create task, notify, generate proposal), conditions, delays, and no-reply reminders. Executed via BullMQ with retries and run history.

### 3.21 Settings
- Org, roles/permissions, integrations, billing, API keys, webhooks, audit log viewer.

## 4. Executive Dashboard

Real-time widgets: Revenue, Profit, Expenses, Pending Payments, Active Projects, Leads, Clients, Employees, Upcoming Meetings, Deadlines, Today's Tasks, Recent Activities, Performance Graphs, Monthly Growth, Lead Funnel, Revenue Forecast, AI Insights. Real-time via Socket.IO; aggregates cached in Redis with event-driven invalidation.

## 5. Non-Functional Requirements

- **Security:** JWT + refresh rotation, OAuth, 2FA, RBAC, rate limiting, encryption at rest (sensitive columns) and in transit, audit logs, activity logs, GDPR-ready (data export + deletion).
- **Performance:** p95 API < 300ms, dashboard first paint < 2s, real-time updates < 1s.
- **Scalability:** stateless API, horizontal scaling, queue-backed heavy work, read-optimized reporting.
- **Accessibility:** WCAG 2.1 AA. Dark + light mode. Fully responsive.
- **Quality:** No placeholder code, no TODOs, tests per module (unit + integration + e2e), documentation per module.

## 6. Delivery Specs

1. PRD + Architecture (this document)
2. Database schema + API contracts
3. Authentication + RBAC + org management
4. CRM + Lead Distribution + Sales Pipeline
5. Project + Task Management
6. Finance
7. HRMS + Employee Portal
8. Client Portal + Support Desk
9. Marketing + Website Monitoring
10. Notifications + Calendar + Knowledge Base
11. AI Assistant + Automation Engine
12. Reports + Dashboard + hardening + deployment

Each phase ships with schema, API, business logic, validation, frontend, permissions, tests, and documentation before the next begins.
