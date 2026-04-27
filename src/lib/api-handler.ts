// src/lib/api-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { withRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-error';

export type ApiHandler = (req: NextRequest, session: any) => Promise<NextResponse>;

interface HandlerOptions {
  rateLimit?: {
    limit: number;
    windowMs: number;
  };
  requireAuth?: boolean;
}

export function withAuth(handler: ApiHandler, options: HandlerOptions = {}) {
  return async (req: NextRequest) => {
    const wrap = async () => {
      try {
        const session = await getServerSession(authOptions);
        
        if (options.requireAuth !== false) {
          if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }

          // FIX P0-A: Instant Revocation Check
          // Compare JWT sessionVersion with real-time DB value
          const userDoc = await adminDb.collection('users').doc(session.user.id).get();
          const currentVersion = userDoc.data()?.sessionVersion || 0;
          
          if (session.user.sessionVersion !== currentVersion) {
            return NextResponse.json(
              { error: 'Session stale or revoked', code: 'SESSION_STALE' }, 
              { status: 401 }
            );
          }
        }

        return await handler(req, session);
      } catch (error) {
        return handleApiError(error);
      }
    };

    if (options.rateLimit) {
      return withRateLimit(req, options.rateLimit.limit, options.rateLimit.windowMs, wrap);
    }

    return wrap();
  };
}
