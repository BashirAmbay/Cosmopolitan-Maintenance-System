import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

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

// Initialize local file database engine
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
} catch (e) {
  console.error('Failed to initialize local database client:', e.message);
}

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
}

export default { dbAll, dbGet, dbRun, dbExec };
export { libsqlClient };
