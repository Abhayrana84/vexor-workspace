// src/lib/admin-auth.ts
import { ROLE_PERMISSIONS, UserRole } from './permissions';
import { adminAuth } from './firebase-admin';

/**
 * Synchronizes a user's role and granular permissions into Firebase Custom Claims.
 * This is the source of truth for the session and Firestore security rules.
 */
export async function syncUserClaims(email: string, role: UserRole) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    const permissions = ROLE_PERMISSIONS[role];

    await adminAuth.setCustomUserClaims(user.uid, {
      role,
      permissions,
    });
    
    console.log(`[AUTH] Successfully synced claims for ${email} (Role: ${role})`);
    return true;
  } catch (error) {
    console.error(`[AUTH] Failed to sync claims for ${email}:`, error);
    return false;
  }
}

/**
 * Revokes refresh tokens for a user, forcing a re-login.
 * Use this for critical permission downgrades.
 */
export async function forceReLogin(email: string) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.revokeRefreshTokens(user.uid);
    return true;
  } catch (error) {
    return false;
  }
}
