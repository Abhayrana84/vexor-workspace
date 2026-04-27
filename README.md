# VEXOR Workspace — Internal OS

> Production-ready internal team management system for Vexor IT Solutions.
> Built with Next.js 14, PostgreSQL, Prisma, and NextAuth.

---

## 📁 Folder Structure

```
vexor-workspace/
├── prisma/
│   ├── schema.prisma          # Database schema (all models)
│   └── seed.ts                # Seed all 7 team members + sample data
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   │   ├── projects/             # GET list, POST create
│   │   │   ├── projects/[id]/        # GET, PATCH, DELETE
│   │   │   ├── tasks/                # GET list, POST create
│   │   │   ├── tasks/[id]/           # GET, PATCH, DELETE
│   │   │   ├── tasks/[id]/comments/  # POST comment
│   │   │   ├── team/                 # GET members, PATCH permission
│   │   │   ├── clients/              # GET list, POST create
│   │   │   ├── dashboard/            # GET stats + activity
│   │   │   └── search/               # GET search projects & tasks
│   │   │
│   │   ├── (app)/                    # Authenticated layout group
│   │   │   ├── layout.tsx            # Sidebar + Topbar shell
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx          # Project list
│   │   │   │   ├── new/page.tsx      # Create project form
│   │   │   │   └── [id]/page.tsx     # Project detail + tasks
│   │   │   ├── kanban/page.tsx       # Drag-and-drop Kanban board
│   │   │   ├── tasks/
│   │   │   │   ├── page.tsx          # All tasks table
│   │   │   │   └── new/page.tsx      # Create task form
│   │   │   ├── team/page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   ├── login/page.tsx            # Auth page
│   │   ├── page.tsx                  # Root redirect
│   │   └── layout.tsx                # HTML shell + providers
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   │   └── Topbar.tsx            # Header with search
│   │   ├── providers/
│   │   │   └── SessionProvider.tsx   # NextAuth client wrapper
│   │   └── ui/
│   │       └── index.tsx             # Avatar, Badge, Button, Modal, Card…
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma singleton
│   │   ├── auth.ts                   # NextAuth config + JWT callbacks
│   │   └── utils.ts                  # cn(), formatDate(), getStatusColor()…
│   │
│   ├── types/
│   │   ├── index.ts                  # All TypeScript interfaces
│   │   └── next-auth.d.ts            # Extended session types
│   │
│   └── styles/
│       └── globals.css               # Tailwind + CSS variables + animations
│
├── .env.example                      # Environment variable template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema

```
User          → has many: assignedTasks, managedProjects, comments, activities
Client        → has many: projects
Project       → belongs to: manager (User), client (Client)
              → has many: tasks, members (ProjectMember), activities
ProjectMember → join table: Project ↔ User
Task          → belongs to: project, assignee (User)
              → has many: comments, activities
Comment       → belongs to: task, author (User)
Activity      → belongs to: user, project?, task?
```

### Enums
| Enum | Values |
|---|---|
| Permission | ADMIN · MANAGER · MEMBER |
| ProjectStatus | PLANNING · IN_PROGRESS · REVIEW · COMPLETED |
| TaskStatus | TODO · IN_PROGRESS · REVIEW · COMPLETED |
| TaskPriority | LOW · MEDIUM · HIGH |

---

## 🔌 API Routes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | Login / logout | Public |
| GET | `/api/dashboard` | Stats + activity feed | Any |
| GET | `/api/projects` | List all projects | Any |
| POST | `/api/projects` | Create project | Admin/Manager |
| GET | `/api/projects/:id` | Project detail | Any |
| PATCH | `/api/projects/:id` | Update project | Admin/Manager |
| DELETE | `/api/projects/:id` | Delete project | Admin only |
| GET | `/api/tasks` | List tasks (filterable) | Any |
| POST | `/api/tasks` | Create task | Admin/Manager |
| GET | `/api/tasks/:id` | Task detail + comments | Any |
| PATCH | `/api/tasks/:id` | Update task / move status | Any |
| DELETE | `/api/tasks/:id` | Delete task | Admin/Manager |
| POST | `/api/tasks/:id/comments` | Add comment | Any |
| GET | `/api/team` | List team members | Any |
| PATCH | `/api/team` | Update permissions | Admin only |
| GET | `/api/clients` | List clients | Any |
| POST | `/api/clients` | Add client | Admin/Manager |
| GET | `/api/search?q=` | Search projects + tasks | Any |

---

## 🔐 RBAC (Role-Based Access Control)

| Feature | Admin | Manager | Member |
|---|---|---|---|
| View all projects & tasks | ✅ | ✅ | ✅ |
| Create projects | ✅ | ✅ | ❌ |
| Edit / delete projects | ✅ | ✅ | ❌ |
| Create / edit tasks | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ |
| Move tasks on Kanban | ✅ | ✅ | ✅ |
| Add comments | ✅ | ✅ | ✅ |
| Manage team permissions | ✅ | ❌ | ❌ |
| Delete projects | ✅ | ❌ | ❌ |
| Add clients | ✅ | ✅ | ❌ |

---

## ⚙️ Step-by-Step Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local or cloud)
- npm or pnpm

---

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/vexor-workspace.git
cd vexor-workspace
npm install
```

---

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/vexor_workspace"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

---

### 3. Set Up the Database

```bash
# Create the database (if using local PostgreSQL)
psql -U postgres -c "CREATE DATABASE vexor_workspace;"

# Push schema to database
npm run db:push

# Seed with all team members + sample data
npm run db:seed
```

---

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### 5. Login

All team members share the same default password: `vexor2025`

| Name | Email | Role |
|---|---|---|
| Abhay Rana | abhay@vexorit.com | Admin |
| Sagar Panwar | sagar@vexorit.com | Admin |
| Anshika Siwach | anshika@vexorit.com | Manager |
| Abhinav | abhinav@vexorit.com | Member |
| Govind Arya | govind@vexorit.com | Member |
| Arnav Rathi | arnav@vexorit.com | Member |
| Vansh Rajput | vansh@vexorit.com | Manager |

---

## 🚀 Deployment Options

### Option A — Vercel + Supabase (Recommended, free tier available)

```bash
# 1. Create project on supabase.com → get PostgreSQL connection string
# 2. Push your code to GitHub
# 3. Import repo on vercel.com
# 4. Add environment variables in Vercel dashboard:
#    DATABASE_URL=<supabase connection string>
#    NEXTAUTH_SECRET=<generated secret>
#    NEXTAUTH_URL=https://your-app.vercel.app
# 5. Deploy — Vercel auto-builds on git push
```

### Option B — Vercel + Railway

```bash
# 1. Create PostgreSQL on railway.app → copy DATABASE_URL
# 2. Deploy to Vercel as above, use Railway's DATABASE_URL
```

### Option C — Self-hosted VPS (Ubuntu)

```bash
# On your server:
git clone repo && cd vexor-workspace
npm install
npm run build

# Set up PostgreSQL, configure .env.local
npm run db:push && npm run db:seed

# Run with PM2
npm install -g pm2
pm2 start npm --name "vexor" -- start
pm2 save && pm2 startup

# Set up Nginx reverse proxy on port 3000
```

### Production Checklist
- [ ] Change all passwords after first login
- [ ] Use a strong `NEXTAUTH_SECRET` (32+ chars)
- [ ] Set `NEXTAUTH_URL` to your actual domain
- [ ] Enable SSL/HTTPS on your domain
- [ ] Set up daily DB backups
- [ ] Configure Prisma connection pooling for production

---

## 🛠️ Useful Dev Commands

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run db:push       # Sync schema to database (no migration history)
npm run db:migrate    # Create a new migration
npm run db:seed       # Seed database with team + sample data
npm run db:studio     # Open Prisma Studio (visual DB browser)
npm run lint          # Run ESLint
```

---

## 🧠 Future Roadmap

- [ ] Real-time updates with Pusher / Ably
- [ ] File attachments on tasks
- [ ] Time tracking per task
- [ ] Invoice generation for clients
- [ ] Slack / email notifications
- [ ] Public project sharing (for client portals)
- [ ] Mobile app (React Native)
- [ ] Convert to multi-tenant SaaS with org management

---

Built with ❤️ for Vexor IT Solutions
