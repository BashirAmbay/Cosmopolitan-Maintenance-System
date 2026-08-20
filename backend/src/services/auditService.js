import { dbRun } from '../config/database.js';

export async function logAudit({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    await dbRun(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        action,
        entityType,
        entityId || null,
        typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress || '127.0.0.1'
      ]
    );
  } catch (err) {
    // Non-critical — audit log failure must not break the request
    console.error('Audit log failed:', err.message);
  }
}
