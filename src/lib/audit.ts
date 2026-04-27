// src/lib/audit.ts
import { adminDb } from './firebase-admin';

export interface AuditLogEntry {
  actor_id: string;
  actor_name: string;
  action: string;
  entity: 'PROJECT' | 'TASK' | 'USER' | 'FINANCE' | 'CLIENT';
  entity_id: string;
  metadata?: any;
  diff?: {
    old: any;
    new: any;
  };
}

/**
 * Creates a secure, immutable audit log entry.
 * Should only be called from server-side logic (APIs/Server Actions).
 */
export async function createAuditLog(entry: AuditLogEntry) {
  try {
    const logRef = adminDb.collection('audit_logs').doc();
    await logRef.set({
      ...entry,
      timestamp: new Date(),
    });
    return true;
  } catch (error) {
    console.error('[AUDIT] Failed to create audit log:', error);
    return false;
  }
}
