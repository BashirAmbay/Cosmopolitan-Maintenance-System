import db from '../config/database.js';

export function getCategories(req, res) {
  try {
    const categories = db.prepare(`
      SELECT c.*,
             (SELECT COUNT(*) FROM maintenance_requests WHERE category_id = c.id) as total_requests
      FROM categories c
      ORDER BY c.name ASC
    `).all();

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

export function createCategory(req, res) {
  try {
    const { name, description, icon, sla_hours } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const stmt = db.prepare('INSERT INTO categories (name, description, icon, sla_hours) VALUES (?, ?, ?, ?)');
    const result = stmt.run(name, description || null, icon || 'wrench', sla_hours || 24);

    res.status(201).json({ message: 'Category created.', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create category.' });
  }
}
