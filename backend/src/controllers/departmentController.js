import { dbAll, dbRun } from '../config/database.js';

export async function getDepartments(req, res) {
  try {
    let departments = await dbAll(`
      SELECT d.*,
             COUNT(u.id) as total_staff,
             (SELECT COUNT(*) FROM maintenance_requests WHERE department_id = d.id) as total_requests
      FROM departments d
      LEFT JOIN users u ON u.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name ASC
    `);

    return res.json({ departments: departments || [] });
  } catch (error) {
    console.error('getDepartments error:', error);
    return res.status(500).json({ error: 'Failed to fetch departments.' });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, code, description, head_name } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department name and code are required.' });
    }

    const result = await dbRun(
      'INSERT INTO departments (name, code, description, head_name) VALUES (?, ?, ?, ?)',
      [name, code, description || null, head_name || null]
    );

    return res.status(201).json({ message: 'Department created.', id: result.lastInsertRowid });
  } catch (error) {
    console.error('createDepartment error:', error);
    return res.status(500).json({ error: 'Failed to create department.' });
  }
}
