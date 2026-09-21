import jwt from 'jsonwebtoken';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cosmopolitan_university_abuja_secret_key_2026');
    
    if (decoded.email) {
      const { dbGet } = await import('../config/database.js');
      const dbUser = await dbGet('SELECT * FROM users WHERE email = ?', [decoded.email.toLowerCase()]);
      if (dbUser) {
        req.user = {
          ...decoded,
          id: dbUser.id,
          role: dbUser.role || decoded.role,
          department_id: dbUser.department_id || decoded.department_id
        };
        return next();
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission denied. Access restricted to roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}
