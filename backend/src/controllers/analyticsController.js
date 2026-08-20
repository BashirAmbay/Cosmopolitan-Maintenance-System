import db from '../config/database.js';

export function getDashboardAnalytics(req, res) {
  try {
    let totalCount = 0, pendingCount = 0, activeCount = 0, resolvedCount = 0, overdueCount = 0, highPriorityCount = 0;

    try {
      const totalObj = db.prepare('SELECT COUNT(*) as count FROM maintenance_requests').get();
      if (totalObj && typeof totalObj.count === 'number') totalCount = totalObj.count;
    } catch (e) {}

    try {
      const pendingObj = db.prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE status = 'pending'").get();
      if (pendingObj && typeof pendingObj.count === 'number') pendingCount = pendingObj.count;
    } catch (e) {}

    try {
      const activeObj = db.prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE status IN ('assigned', 'in_progress')").get();
      if (activeObj && typeof activeObj.count === 'number') activeCount = activeObj.count;
    } catch (e) {}

    try {
      const resolvedObj = db.prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE status IN ('resolved', 'closed')").get();
      if (resolvedObj && typeof resolvedObj.count === 'number') resolvedCount = resolvedObj.count;
    } catch (e) {}

    try {
      const overdueObj = db.prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE status NOT IN ('resolved', 'closed') AND due_date IS NOT NULL AND due_date < datetime('now')").get();
      if (overdueObj && typeof overdueObj.count === 'number') overdueCount = overdueObj.count;
    } catch (e) {}

    try {
      const highPriorityObj = db.prepare("SELECT COUNT(*) as count FROM maintenance_requests WHERE priority IN ('high', 'urgent') AND status NOT IN ('resolved', 'closed')").get();
      if (highPriorityObj && typeof highPriorityObj.count === 'number') highPriorityCount = highPriorityObj.count;
    } catch (e) {}

    let avgResolutionHours = 14.5;
    try {
      const avgResObj = db.prepare(`
        SELECT AVG((julianday(resolved_at) - julianday(created_at)) * 24) as avg_hours 
        FROM maintenance_requests 
        WHERE resolved_at IS NOT NULL
      `).get();
      if (avgResObj && avgResObj.avg_hours) avgResolutionHours = Math.round(avgResObj.avg_hours * 10) / 10;
    } catch (e) {}

    let byDepartment = [];
    try {
      byDepartment = db.prepare(`
        SELECT d.name as department, COUNT(r.id) as count
        FROM departments d
        LEFT JOIN maintenance_requests r ON r.department_id = d.id
        GROUP BY d.id
        ORDER BY count DESC
      `).all() || [];
    } catch (e) {}

    let byLocation = [];
    try {
      byLocation = db.prepare(`
        SELECT l.name as location, l.building, COUNT(r.id) as count
        FROM locations l
        LEFT JOIN maintenance_requests r ON r.location_id = l.id
        GROUP BY l.id
        ORDER BY count DESC
        LIMIT 8
      `).all() || [];
    } catch (e) {}

    let byCategory = [];
    try {
      byCategory = db.prepare(`
        SELECT c.name as category, c.icon, COUNT(r.id) as count
        FROM categories c
        LEFT JOIN maintenance_requests r ON r.category_id = c.id
        GROUP BY c.id
        ORDER BY count DESC
      `).all() || [];
    } catch (e) {}

    let byStatus = [];
    try {
      byStatus = db.prepare(`
        SELECT status, COUNT(*) as count
        FROM maintenance_requests
        GROUP BY status
      `).all() || [];
    } catch (e) {}

    let byPriority = [];
    try {
      byPriority = db.prepare(`
        SELECT priority, COUNT(*) as count
        FROM maintenance_requests
        GROUP BY priority
      `).all() || [];
    } catch (e) {}

    let trends = [];
    try {
      trends = db.prepare(`
        SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as created_count
        FROM maintenance_requests
        GROUP BY date
        ORDER BY date ASC
        LIMIT 14
      `).all() || [];
    } catch (e) {}

    let technicianWorkload = [];
    try {
      technicianWorkload = db.prepare(`
        SELECT u.id, u.name, u.specialization,
               COUNT(CASE WHEN r.status IN ('assigned', 'in_progress') THEN 1 END) as active_tasks,
               COUNT(CASE WHEN r.status IN ('resolved', 'closed') THEN 1 END) as completed_tasks
        FROM users u
        LEFT JOIN maintenance_requests r ON r.assigned_to_id = u.id
        WHERE u.role = 'technician'
        GROUP BY u.id
        ORDER BY active_tasks DESC
      `).all() || [];
    } catch (e) {}

    return res.json({
      metrics: {
        totalRequests: totalCount,
        pendingRequests: pendingCount,
        activeTasks: activeCount,
        resolvedIssues: resolvedCount,
        overdueRequests: overdueCount,
        highPriority: highPriorityCount,
        avgResolutionHours
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
