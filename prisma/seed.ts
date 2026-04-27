import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const Permission = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER'
}

const ProjectStatus = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED'
}

const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED'
}

const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Vexor Workspace database...')

  // Clean existing data
  await prisma.activity.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.client.deleteMany()
  await prisma.user.deleteMany()

  const hash = await bcrypt.hash('vexor2025', 10)

  // ─── TEAM MEMBERS ───────────────────────────────────────────────
  const [abhay, sagar, anshika, abhinav, govind, arnav, vansh] = await Promise.all([
    prisma.user.create({ data: { name: 'Abhay Rana', email: 'abhay@vexorit.com', password: hash, role: 'Founder & CEO', permission: Permission.ADMIN, avatarColor: '#6d6afe', initials: 'AR' } }),
    prisma.user.create({ data: { name: 'Sagar Panwar', email: 'sagar@vexorit.com', password: hash, role: 'Co-Founder & COO', permission: Permission.ADMIN, avatarColor: '#22c55e', initials: 'SP' } }),
    prisma.user.create({ data: { name: 'Anshika Siwach', email: 'anshika@vexorit.com', password: hash, role: 'Project Manager', permission: Permission.MANAGER, avatarColor: '#ec4899', initials: 'AS' } }),
    prisma.user.create({ data: { name: 'Abhinav', email: 'abhinav@vexorit.com', password: hash, role: 'Frontend Head', permission: Permission.MEMBER, avatarColor: '#3b82f6', initials: 'AV' } }),
    prisma.user.create({ data: { name: 'Govind Arya', email: 'govind@vexorit.com', password: hash, role: 'UI/UX Head', permission: Permission.MEMBER, avatarColor: '#f59e0b', initials: 'GA' } }),
    prisma.user.create({ data: { name: 'Arnav Rathi', email: 'arnav@vexorit.com', password: hash, role: 'Social Media Manager', permission: Permission.MEMBER, avatarColor: '#a855f7', initials: 'AR' } }),
    prisma.user.create({ data: { name: 'Vansh Rajput', email: 'vansh@vexorit.com', password: hash, role: 'CCO / Business Head', permission: Permission.MANAGER, avatarColor: '#ef4444', initials: 'VR' } }),
  ])

  // ─── CLIENTS ───────────────────────────────────────────────────
  const [technova, greenpath, urbaneats, swiftpay] = await Promise.all([
    prisma.client.create({ data: { name: 'TechNova Labs', contactName: 'Rahul Mehta', email: 'rahul@technova.in', phone: '+91 98765 43210', emoji: '🔬' } }),
    prisma.client.create({ data: { name: 'GreenPath Solutions', contactName: 'Priya Shah', email: 'priya@greenpath.co', phone: '+91 99887 76655', emoji: '🌿' } }),
    prisma.client.create({ data: { name: 'UrbanEats', contactName: 'Karan Bhat', email: 'karan@urbaneats.app', phone: '+91 91234 56789', emoji: '🍔' } }),
    prisma.client.create({ data: { name: 'SwiftPay Fintech', contactName: 'Aisha Kumar', email: 'aisha@swiftpay.io', phone: '+91 90000 11223', emoji: '💳' } }),
  ])

  // ─── PROJECTS ──────────────────────────────────────────────────
  const p1 = await prisma.project.create({
    data: {
      name: 'TechNova Brand Redesign',
      description: 'Full brand identity overhaul including logo, typography, and visual system.',
      status: ProjectStatus.IN_PROGRESS,
      managerId: anshika.id,
      clientId: technova.id,
      members: { create: [{ userId: anshika.id }, { userId: govind.id }, { userId: abhinav.id }] },
    },
  })

  const p2 = await prisma.project.create({
    data: {
      name: 'GreenPath Website',
      description: 'Sustainable brand website with CMS integration and SEO optimization.',
      status: ProjectStatus.REVIEW,
      managerId: anshika.id,
      clientId: greenpath.id,
      members: { create: [{ userId: anshika.id }, { userId: abhinav.id }, { userId: govind.id }] },
    },
  })

  const p3 = await prisma.project.create({
    data: {
      name: 'UrbanEats App UI',
      description: 'Mobile-first food delivery app interface with dark mode support.',
      status: ProjectStatus.PLANNING,
      managerId: anshika.id,
      clientId: urbaneats.id,
      members: { create: [{ userId: anshika.id }, { userId: govind.id }] },
    },
  })

  const p4 = await prisma.project.create({
    data: {
      name: 'Vexor Internal OS',
      description: 'Internal team workspace and project management system.',
      status: ProjectStatus.IN_PROGRESS,
      managerId: abhay.id,
      clientId: null,
      members: { create: [{ userId: abhay.id }, { userId: abhinav.id }, { userId: govind.id }, { userId: anshika.id }] },
    },
  })

  const p5 = await prisma.project.create({
    data: {
      name: 'SwiftPay Social Campaign',
      description: 'Q1 social media campaign across LinkedIn, Instagram, and Twitter.',
      status: ProjectStatus.COMPLETED,
      managerId: anshika.id,
      clientId: swiftpay.id,
      members: { create: [{ userId: anshika.id }, { userId: arnav.id }, { userId: vansh.id }] },
    },
  })

  // ─── TASKS ─────────────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      { title: 'Design logo concepts — 3 variants', projectId: p1.id, assigneeId: govind.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: new Date('2025-02-15'), position: 0 },
      { title: 'Build landing page — Hero & Features', projectId: p1.id, assigneeId: abhinav.id, priority: TaskPriority.HIGH, status: TaskStatus.TODO, dueDate: new Date('2025-02-20'), position: 1 },
      { title: 'Client feedback call & revision', projectId: p1.id, assigneeId: anshika.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: new Date('2025-02-22'), position: 2 },
      { title: 'Finalize homepage layout', projectId: p2.id, assigneeId: govind.id, priority: TaskPriority.MEDIUM, status: TaskStatus.REVIEW, dueDate: new Date('2025-02-10'), position: 0 },
      { title: 'CMS integration with Sanity', projectId: p2.id, assigneeId: abhinav.id, priority: TaskPriority.HIGH, status: TaskStatus.REVIEW, dueDate: new Date('2025-02-12'), position: 1 },
      { title: 'Wireframes for onboarding flow', projectId: p3.id, assigneeId: govind.id, priority: TaskPriority.LOW, status: TaskStatus.TODO, dueDate: new Date('2025-03-01'), position: 0 },
      { title: 'Competitor research & moodboard', projectId: p3.id, assigneeId: govind.id, priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, dueDate: new Date('2025-02-05'), position: 1 },
      { title: 'Authentication & RBAC system', projectId: p4.id, assigneeId: abhinav.id, priority: TaskPriority.HIGH, status: TaskStatus.COMPLETED, dueDate: new Date('2025-02-28'), position: 0 },
      { title: 'Kanban drag-drop engine', projectId: p4.id, assigneeId: abhinav.id, priority: TaskPriority.HIGH, status: TaskStatus.IN_PROGRESS, dueDate: new Date('2025-03-05'), position: 1 },
      { title: 'Dashboard analytics module', projectId: p4.id, assigneeId: govind.id, priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, dueDate: new Date('2025-03-10'), position: 2 },
      { title: 'Campaign final report', projectId: p5.id, assigneeId: arnav.id, priority: TaskPriority.LOW, status: TaskStatus.COMPLETED, dueDate: new Date('2025-01-31'), position: 0 },
    ],
  })

  // ─── ACTIVITIES ────────────────────────────────────────────────
  await prisma.activity.createMany({
    data: [
      { userId: anshika.id, action: 'updated project status to Review', target: 'GreenPath Website', projectId: p2.id },
      { userId: abhinav.id, action: 'completed task', target: 'Authentication & RBAC system', projectId: p4.id },
      { userId: govind.id, action: 'commented on', target: 'Design logo concepts', projectId: p1.id },
      { userId: arnav.id, action: 'submitted final report for', target: 'SwiftPay Social Campaign', projectId: p5.id },
      { userId: vansh.id, action: 'added new client', target: 'SwiftPay Fintech' },
      { userId: abhay.id, action: 'created project', target: 'Vexor Internal OS', projectId: p4.id },
    ],
  })

  console.log('✅ Seed complete!')
  console.log('\n📋 Login credentials (all users):')
  console.log('   Password: vexor2025')
  console.log('   Emails: abhay@vexorit.com | sagar@vexorit.com | anshika@vexorit.com')
  console.log('           abhinav@vexorit.com | govind@vexorit.com | arnav@vexorit.com | vansh@vexorit.com')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
