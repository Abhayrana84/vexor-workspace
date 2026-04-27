// src/lib/auth.ts
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { adminDb, adminAuth } from './firebase-admin'
import { ROLE_PERMISSIONS, UserRole } from './permissions'

export const authOptions: NextAuthOptions = {
  session: { 
    strategy: 'jwt', 
    maxAge: 8 * 60 * 60 // FIX 7: 8 hours session life
  },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const userSnapshot = await adminDb.collection('users').where('email', '==', credentials.email).limit(1).get()

        if (userSnapshot.empty) return null
        const user = { id: userSnapshot.docs[0].id, ...(userSnapshot.docs[0].data() as any) }

        // FIX 6: Fetch password hash from secure /credentials collection
        const credDoc = await adminDb.collection('credentials').doc(user.id).get()
        const credentialsData = credDoc.data()

        if (!credentialsData?.passwordHash) return null

        const passwordMatch = await bcrypt.compare(credentials.password, credentialsData.passwordHash)
        if (!passwordMatch) return null

        // Fetch the latest Custom Claims from Firebase Auth
        const authUser = await adminAuth.getUserByEmail(credentials.email)
        const claims = authUser.customClaims || {}
        
        // If the database uses 'permission' for the system role and 'role' for display title
        const dbSystemRole = (user.permission || user.role || claims.role || 'MEMBER') as UserRole
        
        // Validate that it's an actual RBAC role, else fallback to MEMBER
        const systemRole = ROLE_PERMISSIONS[dbSystemRole] ? dbSystemRole : 'MEMBER'
        
        const permissions = (user.permissions || claims.permissions || ROLE_PERMISSIONS[systemRole])

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: systemRole,
          permissions: permissions,
          avatarUrl: user.avatarUrl,
          avatarColor: user.avatarColor,
          initials: user.initials,
          sessionVersion: user.sessionVersion || 0,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.permissions = (user as any).permissions
        token.avatarUrl = (user as any).avatarUrl
        token.avatarColor = (user as any).avatarColor
        token.initials = (user as any).initials
        token.sessionVersion = (user as any).sessionVersion || 0
      }
      
      if (trigger === 'update' && session) {
        if (session.avatarUrl !== undefined) token.avatarUrl = session.avatarUrl
        if (session.role !== undefined) token.role = session.role
        if (session.permissions !== undefined) token.permissions = session.permissions
        if (session.sessionVersion !== undefined) token.sessionVersion = session.sessionVersion
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as any
        session.user.avatarUrl = token.avatarUrl as string
        session.user.avatarColor = token.avatarColor as string
        session.user.initials = token.initials as string
        session.user.sessionVersion = token.sessionVersion as number
      }
      return session
    },
  },
}
