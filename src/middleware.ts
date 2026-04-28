// src/middleware.ts
import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Not authenticated → redirect to /login using req.url (real domain, not NEXTAUTH_URL)
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes
  const adminRoutes = ['/team/permissions']
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (token?.role !== 'ADMIN' && token?.permission !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/kanban/:path*',
    '/tasks/:path*',
    '/team/:path*',
    '/clients/:path*',
    '/settings/:path*',
    '/activity/:path*',
    '/finances/:path*',
    '/api/projects/:path*',
    '/api/tasks/:path*',
    '/api/team/:path*',
    '/api/clients/:path*',
    '/api/dashboard/:path*',
    '/api/search/:path*',
    '/api/finances/:path*',
  ],
}
