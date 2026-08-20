import { dbAll, dbGet, dbRun } from '../config/database.js';
import bcrypt from 'bcryptjs';

export async function getUsers(req, res) {
  try {
    const { role, department_id, search } = req.query;

    let query = `
      SELECT u.id, u.name, u.email, u.role, u.department_id, u.phone, u.specialization, u.is_active, u.created_at,
             d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (department_id) {
      query += ` AND u.department_id = ?`;
      params.push(department_id);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.specialization LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY u.name ASC`;

    const users = await dbAll(query, params);
    return res.json({ users });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
}

export async function getTechnicians(req, res) {
  try {
    const technicians = await dbAll(`
      SELECT u.id, u.name, u.email, u.phone, u.specialization, d.name as department_name,
             (SELECT COUNT(*) FROM maintenance_requests WHERE assigned_to_id = u.id AND status IN ('assigned', 'in_progress')) as active_tasks
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.role = 'technician' AND u.is_active = 1
      ORDER BY active_tasks ASC, u.name ASC
    `);

    return res.json({ technicians });
  } catch (error) {
    console.error('getTechnicians error:', error);
    return res.status(500).json({ error: 'Failed to fetch technicians.' });
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password, role, department_id, phone, specialization } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required user fields.' });
    }

    const clean = email.trim().toLowerCase();
    const isCosmo = clean.endsWith('@cosmopolitan.edu.ng') || clean.endsWith('@cosmopolitan.ng') || clean.endsWith('@cosmopolitanuniversity.edu.ng');
    if (!isCosmo) {
      return res.status(400).json({ error: 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.' });
    }

    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'User email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email.toLowerCase(), passwordHash, role, department_id || null, phone || null, specialization || null]
    );

    return res.status(201).json({ message: 'User created successfully', id: result.lastInsertRowid });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
}

export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active, role, department_id } = req.body;

    await dbRun(
      `UPDATE users 
       SET is_active = COALESCE(?, is_active),
           role = COALESCE(?, role),
           department_id = COALESCE(?, department_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [is_active !== undefined ? (is_active ? 1 : 0) : null, role || null, department_id || null, id]
    );

    return res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
}
