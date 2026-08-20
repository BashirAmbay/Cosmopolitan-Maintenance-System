import { dbAll } from '../config/database.js';

export async function getCategories(req, res) {
  try {
    const categories = await dbAll(`
      SELECT c.*,
             (SELECT COUNT(*) FROM maintenance_requests WHERE category_id = c.id) as total_requests
      FROM categories c
      ORDER BY c.name ASC
    `);

    return res.json({ categories });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

export async function createCategory(req, res) {
  try {
    const { name, description, icon, sla_hours } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const { dbRun } = await import('../config/database.js');
    const result = await dbRun(
      'INSERT INTO categories (name, description, icon, sla_hours) VALUES (?, ?, ?, ?)',
      [name, description || null, icon || 'wrench', sla_hours || 24]
    );

    return res.status(201).json({ message: 'Category created.', id: result.lastInsertRowid });
  } catch (error) {
    console.error('createCategory error:', error);
    return res.status(500).json({ error: 'Failed to create category.' });
  }
}
