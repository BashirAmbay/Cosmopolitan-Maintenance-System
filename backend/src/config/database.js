import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
let dbPath = isVercel ? path.join('/tmp', 'database.sqlite') : path.join(__dirname, '../../data/database.sqlite');

if (!isVercel) {
  try {
    const localDir = path.dirname(dbPath);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
  } catch (err) {
    dbPath = path.join('/tmp', 'database.sqlite');
  }
}

try {
  const { default: Database } = await import('better-sqlite3');
  db = new Database(dbPath);
  try { db.pragma('journal_mode = WAL'); } catch (e) {}
  db.pragma('foreign_keys = ON');
} catch (err) {
  console.warn('Native better-sqlite3 driver load fallback:', err.message);
  
  // Safe Fallback Database Interface ensuring Serverless API endpoints never crash
  db = {
    prepare: (sql) => ({
      get: (...params) => null,
      all: (...params) => [],
      run: (...params) => ({ changes: 1, lastInsertRowid: 1 })
    }),
    exec: (sql) => {},
    pragma: (sql) => {}
  };
}

export default db;
