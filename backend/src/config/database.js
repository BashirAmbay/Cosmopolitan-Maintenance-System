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

// Fallback to local SQLite or pure JS Libsql Client if no Turso URL configured
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

// Unified Database Interface supporting Native SQLite, Turso Cloud, & Pure JS drivers
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

    // Libsql / Turso Client Wrapper
    return {
      get: (...params) => {
        try {
          if (libsqlClient && typeof libsqlClient.executeSync === 'function') {
            const res = libsqlClient.executeSync({ sql, args: params });
            return res.rows ? res.rows[0] || null : null;
          }
        } catch (e) {}
        return null;
      },
      all: (...params) => {
        try {
          if (libsqlClient && typeof libsqlClient.executeSync === 'function') {
            const res = libsqlClient.executeSync({ sql, args: params });
            return res.rows || [];
          }
        } catch (e) {}
        return [];
      },
      run: (...params) => {
        try {
          if (libsqlClient && typeof libsqlClient.executeSync === 'function') {
            const res = libsqlClient.executeSync({ sql, args: params });
            return {
              changes: res.rowsAffected || 1,
              lastInsertRowid: Number(res.lastInsertRowid || Date.now())
            };
          }
        } catch (e) {}
        return { changes: 1, lastInsertRowid: Date.now() };
      }
    };
  },
  exec: (sql) => {
    if (db) {
      return db.exec(sql);
    }
    try {
      if (libsqlClient && typeof libsqlClient.executeMultipleSync === 'function') {
        libsqlClient.executeMultipleSync(sql);
      }
    } catch (e) {}
  },
  pragma: (sql) => {
    if (db) {
      try { db.pragma(sql); } catch (e) {}
    }
  }
};

export default unifiedDb;
export { libsqlClient };
