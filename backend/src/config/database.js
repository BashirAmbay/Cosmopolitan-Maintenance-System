import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

try {
  const { default: Database } = await import('better-sqlite3');

  let dbPath;
  const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);

  if (isVercel) {
    dbPath = path.join('/tmp', 'database.sqlite');
  } else {
    try {
      const localDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      dbPath = path.join(localDir, 'database.sqlite');
    } catch (err) {
      dbPath = path.join('/tmp', 'database.sqlite');
    }
  }

  db = new Database(dbPath);

  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {
    // Ignore WAL fallback in environments where WAL is not supported
  }

  db.pragma('foreign_keys = ON');
} catch (err) {
  console.error('Database initialization warning:', err.message);
}

export default db;
