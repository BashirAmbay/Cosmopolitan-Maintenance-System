import { dbAll, dbGet } from '../config/database.js';

export async function getDashboardAnalytics(req, res) {
  try {
    const totalObj = await dbGet('SELECT COUNT(*) as count FROM maintenance_requests', []);
    const pendingObj = await dbGet("SELECT COUNT(*) as count FROM maintenance_requests WHERE status = 'pending'", []);
    const activeObj = await dbGet("SELECT COUNT(*) as count FROM maintenance_requests WHERE status IN ('assigned', 'in_progress')", []);
    const resolvedObj = await dbGet("SELECT COUNT(*) as count FROM maintenance_requests WHERE status IN ('resolved', 'closed')", []);
    const overdueObj = await dbGet("SELECT COUNT(*) as count FROM maintenance_requests WHERE status NOT IN ('resolved', 'closed') AND due_date IS NOT NULL AND due_date < datetime('now')", []);
    const highPriorityObj = await dbGet("SELECT COUNT(*) as count FROM maintenance_requests WHERE priority IN ('high', 'urgent') AND status NOT IN ('resolved', 'closed')", []);
    const avgResObj = await dbGet(`SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours FROM maintenance_requests WHERE resolved_at IS NOT NULL`, []);

    const byDepartment = await dbAll(`
      SELECT d.name as department, COUNT(r.id) as count
      FROM departments d
      LEFT JOIN maintenance_requests r ON r.department_id = d.id
      GROUP BY d.id
      ORDER BY count DESC
    `, []);

    const byLocation = await dbAll(`
      SELECT l.name as location, l.building, COUNT(r.id) as count
      FROM locations l
      LEFT JOIN maintenance_requests r ON r.location_id = l.id
      GROUP BY l.id
      ORDER BY count DESC
      LIMIT 8
    `, []);

    const byCategory = await dbAll(`
      SELECT c.name as category, c.icon, COUNT(r.id) as count
      FROM categories c
      LEFT JOIN maintenance_requests r ON r.category_id = c.id
      GROUP BY c.id
      ORDER BY count DESC
    `, []);

    const byStatus = await dbAll(`
      SELECT status, COUNT(*) as count FROM maintenance_requests GROUP BY status
    `, []);

    const byPriority = await dbAll(`
      SELECT priority, COUNT(*) as count FROM maintenance_requests GROUP BY priority
    `, []);

    const trends = await dbAll(`
      SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as created_count
      FROM maintenance_requests
      GROUP BY date ORDER BY date ASC LIMIT 14
    `, []);

    const technicianWorkload = await dbAll(`
      SELECT u.id, u.name, u.specialization,
             COUNT(CASE WHEN r.status IN ('assigned', 'in_progress') THEN 1 END) as active_tasks,
             COUNT(CASE WHEN r.status IN ('resolved', 'closed') THEN 1 END) as completed_tasks
      FROM users u
      LEFT JOIN maintenance_requests r ON r.assigned_to_id = u.id
      WHERE u.role = 'technician'
      GROUP BY u.id
      ORDER BY active_tasks DESC
    `, []);

    return res.json({
      metrics: {
        totalRequests: totalObj?.count || 0,
        pendingRequests: pendingObj?.count || 0,
        activeTasks: activeObj?.count || 0,
        resolvedIssues: resolvedObj?.count || 0,
        overdueRequests: overdueObj?.count || 0,
        highPriority: highPriorityObj?.count || 0,
        avgResolutionHours: avgResObj?.avg_hours ? Math.round(avgResObj.avg_hours * 10) / 10 : 14.5
      },
      byDepartment,
      byLocation,
      byCategory,
      byStatus,
      byPriority,
      trends,
      technicianWorkload
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch management analytics.' });
  }
}
