// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

import { NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

const handler = NextAuth(authOptions)

export async function GET(req: NextRequest, ctx: any) {
  return withRateLimit(req, 10, 60 * 1000, () => handler(req, ctx))
}

export async function POST(req: NextRequest, ctx: any) {
  return withRateLimit(req, 10, 60 * 1000, () => handler(req, ctx))
}
