import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let db = null;
let libsqlClient = null;

// Initialize Turso Cloud Client if TURSO_DATABASE_URL is provided in environment
if (tursoUrl) {
  try {
    libsqlClient = createClient({
      url: tursoUrl,
      authToken: tursoToken
    });
    console.log('Connected to Turso Cloud SQLite Database:', tursoUrl);
  } catch (err) {
    console.warn('Failed to connect to Turso Cloud DB:', err.message);
  }
}

// Fallback to local SQLite if no Turso URL configured
if (!tursoUrl) {
  const dbDir = path.join(__dirname, '../../data');
  const dbPath = isVercel
    ? path.join('/tmp', 'database.sqlite')
    : path.join(dbDir, 'database.sqlite');

  if (!isVercel && !fs.existsSync(dbDir)) {
    try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
  }

  try {
    const { default: Database } = await import('better-sqlite3');
    db = new Database(dbPath);
    try { db.pragma('journal_mode = WAL'); } catch (e) {}
    db.pragma('foreign_keys = ON');
  } catch (err) {
    // Native better-sqlite3 not available, fallback to @libsql/client file driver
    const fileUrl = isVercel
      ? 'file:/tmp/database.sqlite'
      : `file:${dbPath.replace(/\\/g, '/')}`;
    try {
      libsqlClient = createClient({ url: fileUrl });
    } catch (e) {}
  }
}

// ─── Async query helpers (always works with both local sqlite and Turso) ──────

/**
 * Run an async SELECT query returning all rows.
 * @param {string} sql
 * @param {Array} args
 * @returns {Promise<Array>}
 */
export async function dbAll(sql, args = []) {
  if (db) {
    try {
      const stmt = db.prepare(sql);
      return stmt.all(...args) || [];
    } catch (e) {
      console.error('dbAll (sqlite) error:', e.message);
      return [];
    }
  }
  if (libsqlClient) {
    try {
      const res = await libsqlClient.execute({ sql, args });
      if (!res.rows) return [];
      // Convert libsql Row objects to plain JS objects with column names
      return res.rows.map(row => {
        const obj = {};
        res.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } catch (e) {
      console.error('dbAll (turso) error:', e.message);
      return [];
    }
  }
  return [];
}

/**
 * Run an async SELECT query returning first row.
 * @param {string} sql
 * @param {Array} args
 * @returns {Promise<Object|null>}
 */
export async function dbGet(sql, args = []) {
  if (db) {
    try {
      const stmt = db.prepare(sql);
      return stmt.get(...args) || null;
    } catch (e) {
      console.error('dbGet (sqlite) error:', e.message);
      return null;
    }
  }
  if (libsqlClient) {
    try {
      const res = await libsqlClient.execute({ sql, args });
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      const obj = {};
      res.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    } catch (e) {
      console.error('dbGet (turso) error:', e.message);
      return null;
    }
  }
  return null;
}

/**
 * Run an async INSERT/UPDATE/DELETE query.
 * @param {string} sql
 * @param {Array} args
 * @returns {Promise<{changes: number, lastInsertRowid: number}>}
 */
export async function dbRun(sql, args = []) {
  if (db) {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...args);
      return { changes: result.changes || 0, lastInsertRowid: Number(result.lastInsertRowid || 0) };
    } catch (e) {
      console.error('dbRun (sqlite) error:', e.message);
      return { changes: 0, lastInsertRowid: 0 };
    }
  }
  if (libsqlClient) {
    try {
      const res = await libsqlClient.execute({ sql, args });
      return { changes: res.rowsAffected || 0, lastInsertRowid: Number(res.lastInsertRowid || 0) };
    } catch (e) {
      console.error('dbRun (turso) error:', e.message);
      return { changes: 0, lastInsertRowid: 0 };
    }
  }
  return { changes: 0, lastInsertRowid: 0 };
}

/**
 * Run multiple SQL statements (for schema initialization).
 * @param {string} sql
 */
export async function dbExec(sql) {
  if (db) {
    try { db.exec(sql); } catch (e) { console.error('dbExec (sqlite) error:', e.message); }
    return;
  }
  if (libsqlClient) {
    try {
      // Split on semicolons and execute each statement
      const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        try {
          await libsqlClient.execute(stmt + ';');
        } catch (e) {
          // Ignore "table already exists" etc.
        }
      }
    } catch (e) {
      console.error('dbExec (turso) error:', e.message);
    }
  }
}

// Legacy synchronous interface (kept for backward compat with local sqlite only)
const unifiedDb = {
  prepare: (sql) => {
    if (db) {
      const stmt = db.prepare(sql);
      return {
        get: (...params) => stmt.get(...params),
        all: (...params) => stmt.all(...params),
        run: (...params) => stmt.run(...params)
      };
    }
    // For Turso: return async stubs that log a warning
    return {
      get: () => { console.warn('Sync .get() called on Turso client — use dbGet() instead'); return null; },
      all: () => { console.warn('Sync .all() called on Turso client — use dbAll() instead'); return []; },
      run: () => { console.warn('Sync .run() called on Turso client — use dbRun() instead'); return { changes: 0, lastInsertRowid: 0 }; }
    };
  },
  exec: (sql) => {
    if (db) { try { return db.exec(sql); } catch (e) {} }
  },
  pragma: (sql) => {
    if (db) { try { db.pragma(sql); } catch (e) {} }
  }
};

export default unifiedDb;
export { libsqlClient };
