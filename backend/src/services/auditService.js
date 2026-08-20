import db from '../config/database.js';

export function logAudit({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      userId || null,
      action,
      entityType,
      entityId || null,
      typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}
