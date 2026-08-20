import db from '../config/database.js';

export function getDepartments(req, res) {
  try {
    const departments = db.prepare(`
      SELECT d.*, 
             COUNT(u.id) as total_staff,
             (SELECT COUNT(*) FROM maintenance_requests WHERE department_id = d.id) as total_requests
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `).all();

    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
}

export function createDepartment(req, res) {
  try {
    const { name, code, description, head_name } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }

    const stmt = db.prepare('INSERT INTO departments (name, code, description, head_name) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, code, description || null, head_name || null);

    res.status(201).json({ message: 'Department created.', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create department.' });
  }
}
