import db from '../config/database.js';

export function getLocations(req, res) {
  try {
    const locations = db.prepare(`
      SELECT l.*,
             (SELECT COUNT(*) FROM maintenance_requests WHERE location_id = l.id) as total_requests
      FROM locations l
      ORDER BY l.building ASC, l.name ASC
    `).all();

    res.json({ locations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations.' });
  }
}

export function createLocation(req, res) {
  try {
    const { name, building, floor, room_number, description } = req.body;
    if (!name || !building) {
      return res.status(400).json({ error: 'Location name and building are required.' });
    }

    const stmt = db.prepare('INSERT INTO locations (name, building, floor, room_number, description) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name, building, floor || null, room_number || null, description || null);

    res.status(201).json({ message: 'Location created.', id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create location.' });
  }
}
