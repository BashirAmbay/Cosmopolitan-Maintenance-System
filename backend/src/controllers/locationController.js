import { dbAll, dbRun } from '../config/database.js';

export async function getLocations(req, res) {
  try {
    const locations = await dbAll(`
      SELECT l.*,
             (SELECT COUNT(*) FROM maintenance_requests WHERE location_id = l.id) as total_requests
      FROM locations l
      ORDER BY l.floor ASC, l.room_number ASC
    `);

    return res.json({ locations });
  } catch (error) {
    console.error('getLocations error:', error);
    return res.status(500).json({ error: 'Failed to fetch locations.' });
  }
}

export async function createLocation(req, res) {
  try {
    const { name, building, floor, room_number, description } = req.body;
    if (!name || !building) {
      return res.status(400).json({ error: 'Location name and building are required.' });
    }

    const result = await dbRun(
      'INSERT INTO locations (name, building, floor, room_number, description) VALUES (?, ?, ?, ?, ?)',
      [name, building, floor || null, room_number || null, description || null]
    );

    return res.status(201).json({ message: 'Location created.', id: result.lastInsertRowid });
  } catch (error) {
    console.error('createLocation error:', error);
    return res.status(500).json({ error: 'Failed to create location.' });
  }
}
