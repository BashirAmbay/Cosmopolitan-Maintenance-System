import { dbGet, dbRun } from '../config/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logAudit } from '../services/auditService.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['student', 'staff', 'technician']),
  department_id: z.union([z.number(), z.string(), z.null()]).optional().transform(v => (v ? Number(v) : null)),
  phone: z.string().optional().nullable(),
  specialization: z.string().optional().nullable()
});

const completeProfileSchema = z.object({
  role: z.enum(['student', 'staff', 'technician']),
  department_id: z.union([z.number(), z.string(), z.null()]).optional().transform(v => (v ? Number(v) : null)),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  specialization: z.string().optional().nullable()
});

function isCosmopolitanEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  return (
    clean.endsWith('@cosmopolitan.edu.ng') ||
    clean.endsWith('@cosmopolitan.ng') ||
    clean.endsWith('@cosmopolitanuniversity.edu.ng')
  );
}

function nameFromEmail(email) {
  const username = email.split('@')[0];
  const parts = username.replace(/[._]/g, ' ').split(' ');
  return parts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

export async function login(req, res) {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const { email, password } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    if (!isCosmopolitanEmail(cleanEmail)) {
      return res.status(400).json({
        error: 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.'
      });
    }

    let user = await dbGet(
      'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.email = ?',
      [cleanEmail]
    );

    let requiresSetup = false;

    if (!user) {
      const defaultName = nameFromEmail(cleanEmail);
      const defaultPasswordHash = await bcrypt.hash(password || 'password123', 10);

      let assignedRole = 'student';
      if (cleanEmail.startsWith('admin@') || cleanEmail.includes('admin')) {
        assignedRole = 'admin';
      } else if (cleanEmail.startsWith('management@') || cleanEmail.startsWith('vc@')) {
        assignedRole = 'management';
      } else if (cleanEmail.startsWith('tech.') || cleanEmail.includes('technician')) {
        assignedRole = 'technician';
      }

      const defaultDept = await dbGet("SELECT id FROM departments WHERE code = 'CSIT' LIMIT 1", []);

      const result = await dbRun(
        `INSERT INTO users (name, email, password_hash, role, department_id, phone, specialization, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [defaultName, cleanEmail, defaultPasswordHash, assignedRole, defaultDept ? defaultDept.id : null, null, null]
      );

      const insertId = result.lastInsertRowid || Date.now();

      user = await dbGet(
        'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
        [insertId]
      );

      if (!user) {
        user = {
          id: insertId,
          email: cleanEmail,
          name: defaultName,
          role: assignedRole,
          department_id: defaultDept ? defaultDept.id : null,
          is_active: 1
        };
      }

      requiresSetup = (assignedRole === 'student' || assignedRole === 'staff');

      try {
        logAudit({
          userId: user.id,
          action: 'USER_AUTO_PROVISION',
          entityType: 'USER',
          entityId: user.id,
          details: `Auto-provisioned SSO account for ${user.email}`,
          ipAddress: req.ip
        });
      } catch (auditErr) {}
    } else {
      if (user.password_hash) {
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
          return res.status(400).json({
            error: 'Incorrect password. Please enter the password you used previously, or click "Forgot Password" to reset it.'
          });
        }
      }

      if (user.is_active === 0) {
        return res.status(403).json({ error: 'Account is deactivated. Contact University IT Admin.' });
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department_id: user.department_id
      },
      process.env.JWT_SECRET || 'cosmopolitan_university_abuja_secret_key_2026',
      { expiresIn: '7d' }
    );

    try {
      logAudit({
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: `User ${user.email} logged in successfully`,
        ipAddress: req.ip
      });
    } catch (auditErr) {}

    const { password_hash, ...userWithoutPassword } = user;

    return res.json({
      message: 'Login successful',
      token,
      requiresSetup,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function completeProfile(req, res) {
  try {
    const parse = completeProfileSchema.safeParse(req.body);
    if (!parse.success) {
      console.warn('Profile completion validation details:', parse.error.format());
      return res.status(400).json({ error: 'Invalid profile setup parameters.' });
    }

    const { role, department_id, name, phone, specialization } = parse.data;
    const userId = req.user?.id || 1;

    await dbRun(
      `UPDATE users SET role = ?, department_id = ?, name = COALESCE(?, name), phone = COALESCE(?, phone), specialization = COALESCE(?, specialization)
       WHERE id = ?`,
      [role, department_id || null, name || null, phone || null, specialization || null, userId]
    );

    let updatedUser = await dbGet(
      'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [userId]
    );

    if (!updatedUser) {
      updatedUser = {
        id: userId,
        email: req.user?.email || 'user@cosmopolitan.edu.ng',
        name: name || req.user?.name || 'Cosmopolitan User',
        role: role,
        department_id: department_id || null,
        phone: phone || null,
        specialization: specialization || null,
        is_active: 1
      };
    }

    const token = jwt.sign(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department_id: updatedUser.department_id
      },
      process.env.JWT_SECRET || 'cosmopolitan_university_abuja_secret_key_2026',
      { expiresIn: '7d' }
    );

    try {
      logAudit({
        userId: updatedUser.id,
        action: 'USER_PROFILE_COMPLETED',
        entityType: 'USER',
        entityId: updatedUser.id,
        details: `User ${updatedUser.email} set role to ${role}`,
        ipAddress: req.ip
      });
    } catch (auditErr) {}

    const { password_hash, ...userWithoutPassword } = updatedUser;

    return res.json({
      message: 'Campus identity and role configured successfully!',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return res.status(500).json({ error: 'Failed to update user role and department.' });
  }
}

export async function register(req, res) {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Validation error', details: parse.error.format() });
    }

    const { name, email, password, role, department_id, phone, specialization } = parse.data;

    if (!isCosmopolitanEmail(email)) {
      return res.status(400).json({
        error: 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.'
      });
    }

    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: 'User email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await dbRun(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone, specialization)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email.toLowerCase(), passwordHash, role, department_id || null, phone || null, specialization || null]
    );

    const insertId = result.lastInsertRowid || Date.now();

    let newUser = await dbGet(
      'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [insertId]
    );

    if (!newUser) {
      newUser = {
        id: insertId,
        email: email.toLowerCase(),
        name,
        role,
        department_id: department_id || null,
        phone: phone || null,
        specialization: specialization || null,
        is_active: 1
      };
    }

    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department_id: newUser.department_id
      },
      process.env.JWT_SECRET || 'cosmopolitan_university_abuja_secret_key_2026',
      { expiresIn: '7d' }
    );

    try {
      logAudit({
        userId: newUser.id,
        action: 'USER_REGISTER',
        entityType: 'USER',
        entityId: newUser.id,
        details: `New account registered for ${newUser.email}`,
        ipAddress: req.ip
      });
    } catch (auditErr) {}

    const { password_hash, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
}

export async function getCurrentUser(req, res) {
  try {
    let user = await dbGet(
      'SELECT u.*, d.name as department_name FROM users u LEFT JOIN departments d ON u.department_id = d.id WHERE u.id = ?',
      [req.user.id]
    );

    if (!user) {
      user = {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || 'Cosmopolitan User',
        role: req.user.role || 'student',
        department_id: req.user.department_id || null
      };
    }

    const { password_hash, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch current user profile.' });
  }
}

const resetPasswordSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long')
});

export async function resetPassword(req, res) {
  try {
    const parse = resetPasswordSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const { email, newPassword } = parse.data;
    const cleanEmail = email.toLowerCase().trim();

    if (!isCosmopolitanEmail(cleanEmail)) {
      return res.status(400).json({
        error: 'This email is not a Cosmopolitan email, please login with your Cosmopolitan email.'
      });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);
    const passwordHash = await bcrypt.hash(newPassword, 10);

    if (!user) {
      const defaultName = nameFromEmail(cleanEmail);
      const defaultDept = await dbGet("SELECT id FROM departments WHERE code = 'CSIT' LIMIT 1", []);
      const result = await dbRun(
        `INSERT INTO users (name, email, password_hash, role, department_id, is_active) VALUES (?, ?, ?, 'student', ?, 1)`,
        [defaultName, cleanEmail, passwordHash, defaultDept ? defaultDept.id : null]
      );
      try {
        logAudit({ userId: result.lastInsertRowid, action: 'USER_PASSWORD_RESET', entityType: 'USER', entityId: result.lastInsertRowid, details: `Password reset for new user ${cleanEmail}`, ipAddress: req.ip });
      } catch (e) {}
    } else {
      await dbRun('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, user.id]);
      try {
        logAudit({ userId: user.id, action: 'USER_PASSWORD_RESET', entityType: 'USER', entityId: user.id, details: `Password reset successfully for ${cleanEmail}`, ipAddress: req.ip });
      } catch (auditErr) {}
    }

    return res.json({ message: 'Password updated successfully! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Internal server error while resetting password.' });
  }
}
