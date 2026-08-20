import db from '../config/database.js';

export function getNotifications(req, res) {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 20
    `).all(req.user.id);

    const unreadObj = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);

    res.json({
      notifications,
      unreadCount: unreadObj ? unreadObj.count : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
}

export function markAsRead(req, res) {
  try {
    const { id } = req.params;
    if (id === 'all') {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user.id);
    }
    res.json({ message: 'Notification(s) marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
}

export function getAuditLogs(req, res) {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();

    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
}
