// src/app/api/auth/change-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';

import { withRateLimit } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/api-error';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  return withRateLimit(req, 10, 60 * 1000, async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { currentPassword, newPassword } = await req.json();

      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
      }

      // FIX P0-A: Fetch from credentials collection
      const credDoc = await adminDb.collection('credentials').doc(session.user.id).get();
      if (!credDoc.exists) {
        return NextResponse.json({ error: 'Security profile not found' }, { status: 404 });
      }

      const { passwordHash } = credDoc.data() as any;
      const isMatch = await bcrypt.compare(currentPassword, passwordHash);

      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      
      const batch = adminDb.batch();

      // 1. Update secure credentials
      batch.update(adminDb.collection('credentials').doc(session.user.id), {
        passwordHash: hashedNewPassword,
        updatedAt: new Date(),
      });

      // 2. FIX P0-B: Increment sessionVersion to invalidate all existing JWTs
      batch.update(adminDb.collection('users').doc(session.user.id), {
        sessionVersion: (session.user.sessionVersion || 0) + 1,
        updatedAt: new Date(),
      });

      await batch.commit();

      // 3. Update in Firebase Auth
      await adminAuth.updateUser(session.user.id, { password: newPassword });
      
      // FIX: Also revoke all refresh tokens in Firebase Auth
      await adminAuth.revokeRefreshTokens(session.user.id);

      return NextResponse.json({ message: 'Password updated, sessions revoked, and JWT version incremented' });
    } catch (error) {
      return handleApiError(error);
    }
  });
}
