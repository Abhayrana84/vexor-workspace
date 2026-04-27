// src/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Admin-only routes
    const adminRoutes = ['/team/permissions']
    if (adminRoutes.some((r) => pathname.startsWith(r))) {
      if (token?.permission !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/kanban/:path*',
    '/tasks/:path*',
    '/team/:path*',
    '/clients/:path*',
    '/settings/:path*',
    '/api/projects/:path*',
    '/api/tasks/:path*',
    '/api/team/:path*',
    '/api/clients/:path*',
    '/api/dashboard/:path*',
    '/api/search/:path*',
  ],
}
