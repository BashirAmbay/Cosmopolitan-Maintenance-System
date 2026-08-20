import { dbAll, dbGet, dbRun } from '../config/database.js';

export async function getNotifications(req, res) {
  try {
    const notifications = await dbAll(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );

    const unreadObj = await dbGet(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    return res.json({
      notifications,
      unreadCount: unreadObj ? unreadObj.count : 0
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await dbRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    } else {
      await dbRun('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    }
    return res.json({ message: 'Notification(s) marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
}

export async function getAuditLogs(req, res) {
  try {
    const logs = await dbAll(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);

    return res.json({ logs });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
}
