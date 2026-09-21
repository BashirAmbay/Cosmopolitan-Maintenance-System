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
let localClient = null;

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

// Always initialize local file database engine
const dbDir = path.join(__dirname, '../../data');
const dbPath = isVercel
  ? path.join('/tmp', 'database.sqlite')
  : path.join(dbDir, 'database.sqlite');

if (!isVercel && !fs.existsSync(dbDir)) {
  try { fs.mkdirSync(dbDir, { recursive: true }); } catch (e) {}
}

const fileUrl = isVercel
  ? 'file:/tmp/database.sqlite'
  : `file:${dbPath.replace(/\\/g, '/')}`;
try {
  localClient = createClient({ url: fileUrl });
} catch (e) {}

try {
  const { default: Database } = await import('better-sqlite3');
  db = new Database(dbPath);
  try { db.pragma('journal_mode = WAL'); } catch (e) {}
  db.pragma('foreign_keys = ON');
} catch (err) {}

// ─── Async query helpers (always works with both local sqlite and Turso) ──────

/**
 * Run an async SELECT query returning all rows.
 * @param {string} sql
 * @param {Array} args
 * @returns {Promise<Array>}
 */
export async function dbAll(sql, args = []) {
  if (libsqlClient && tursoUrl) {
    try {
      const res = await libsqlClient.execute({ sql, args });
      if (!res.rows) return [];
      return res.rows.map(row => {
        const obj = {};
        res.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } catch (e) {
      // Fallback to local
    }
  }
  if (localClient) {
    try {
      const res = await localClient.execute({ sql, args });
      if (!res.rows) return [];
      return res.rows.map(row => {
        const obj = {};
        res.columns.forEach((col, i) => { obj[col] = row[i]; });
        return obj;
      });
    } catch (e) {}
  }
  if (db) {
    try {
      const stmt = db.prepare(sql);
      return stmt.all(...args) || [];
    } catch (e) {
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
  if (libsqlClient && tursoUrl) {
    try {
      const res = await libsqlClient.execute({ sql, args });
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      const obj = {};
      res.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    } catch (e) {
      // Fallback to local
    }
  }
  if (localClient) {
    try {
      const res = await localClient.execute({ sql, args });
      if (!res.rows || res.rows.length === 0) return null;
      const row = res.rows[0];
      const obj = {};
      res.columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    } catch (e) {}
  }
  if (db) {
    try {
      const stmt = db.prepare(sql);
      return stmt.get(...args) || null;
    } catch (e) {
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
  if (libsqlClient && tursoUrl) {
    try {
      const res = await libsqlClient.execute({ sql, args });
      return { changes: res.rowsAffected || 0, lastInsertRowid: Number(res.lastInsertRowid || 0) };
    } catch (e) {
      // Fallback to local
    }
  }
  if (localClient) {
    try {
      const res = await localClient.execute({ sql, args });
      return { changes: res.rowsAffected || 0, lastInsertRowid: Number(res.lastInsertRowid || 0) };
    } catch (e) {
      console.error('dbRun (local) error:', e.message);
      return { changes: 0, lastInsertRowid: 0 };
    }
  }
  if (db) {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(...args);
      return { changes: result.changes || 0, lastInsertRowid: Number(result.lastInsertRowid || 0) };
    } catch (e) {
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
  if (libsqlClient && tursoUrl) {
    try {
      const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        try { await libsqlClient.execute(stmt + ';'); } catch (e) {}
      }
    } catch (e) {}
  }
  if (localClient) {
    try {
      const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        try { await localClient.execute(stmt + ';'); } catch (e) {}
      }
    } catch (e) {}
  }
  if (db) {
    try { db.exec(sql); } catch (e) {}
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
