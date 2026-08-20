import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const tursoUrl = process.env.TURSO_DATABASE_URL || 'libsql://database-bashirambay.aws-ap-northeast-1.turso.io';
const tursoToken = process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODk4MzE5ODksImlhdCI6MTc4NzIzOTk4OSwiaWQiOiIwMWEwMWZjYy1mMzAxLTdlNGItOTNiYS01NjE4Mjg3YzY2NjciLCJraWQiOiJoeElBVW9nVlJFOVVnU2FpM2hUMHUyTlNlSWlVRnBQVS1PcUFrazItYVE0IiwicmlkIjoiMDY3OWZlZTEtYzIyYi00NjRjLTgyYzgtMDk5YWU4MTI3MjAyIn0.n0CZF8Cq2fUCc9z6-jMQ27EUZL6aRdiyfkctc7ANURlkNE2yQSm33MVqy4T1D-RKYrzVfMnyVv7UfAiwRu2XBg';

console.log('📡 Connecting to Turso Cloud Database:', tursoUrl);
const client = createClient({ url: tursoUrl, authToken: tursoToken });

async function initTurso() {
  try {
    console.log('⚡ Initializing Database Schema on Turso...');

    await client.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        code TEXT NOT NULL UNIQUE,
        description TEXT,
        head_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        building TEXT NOT NULL,
        floor TEXT,
        room_number TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT DEFAULT 'wrench',
        sla_hours INTEGER DEFAULT 24,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        department_id INTEGER,
        phone TEXT,
        avatar_url TEXT,
        specialization TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_number TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category_id INTEGER NOT NULL,
        location_id INTEGER NOT NULL,
        department_id INTEGER,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        reported_by_id INTEGER NOT NULL,
        assigned_to_id INTEGER,
        due_date DATETIME,
        resolution_notes TEXT,
        resolved_at DATETIME,
        closed_at DATETIME,
        user_rating INTEGER,
        user_feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        technician_id INTEGER NOT NULL,
        assigned_by_id INTEGER NOT NULL,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        status TEXT DEFAULT 'active'
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_internal INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        comment_id INTEGER,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        attachment_type TEXT DEFAULT 'evidence',
        uploaded_by_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by_id INTEGER NOT NULL,
        remarks TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ ALL 11 tables successfully created on Turso Cloud Database!');

    // Seed departments
    const depts = [
      ['Computer Science & IT', 'CSIT', 'School of Technology & Computing', 'Dr. Aliyu Bello'],
      ['Estates & Physical Planning', 'ESTATES', 'University Works & Infrastructure', 'Engr. Mustapha K.'],
      ['Electrical Engineering', 'EENG', 'Faculty of Engineering', 'Dr. Clement O.'],
      ['Medical Sciences & Nursing', 'MEDS', 'College of Health Sciences', 'Prof. Amina Abubakar'],
      ['Business Administration', 'BUS', 'School of Management', 'Dr. Sarah John']
    ];

    for (const d of depts) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO departments (name, code, description, head_name) VALUES (?, ?, ?, ?)',
          args: d
        });
      } catch (e) {}
    }

    // Seed locations
    const locs = [
      ['Computer Lab 2', 'Main Academic Block', 'Ground Floor', 'G-14', 'High performance desktop workstation laboratory'],
      ['Main Auditorium', 'Administration Complex', 'Ground Floor', 'AUD-01', 'Central 1,200 capacity university event hall'],
      ['Electrical Power House', 'Works Substation', 'Ground Floor', 'PH-01', 'Transformers & central backup generator plant'],
      ['Library e-Resource Center', 'University Library', '1st Floor', 'L-102', 'Student research & digital catalogue zone'],
      ['Faculty Office B3', 'Main Academic Block', '2nd Floor', 'B-304', 'Staff office suite']
    ];

    for (const l of locs) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO locations (name, building, floor, room_number, description) VALUES (?, ?, ?, ?, ?)',
          args: l
        });
      } catch (e) {}
    }

    // Seed categories
    const cats = [
      ['Electrical & Power', 'Power outlets, lighting, circuit breakers & generators', 'zap', 6],
      ['Plumbing & Water', 'Pipe leaks, taps, drainage, restrooms & water supply', 'droplet', 12],
      ['HVAC & Air Conditioning', 'Split unit ACs, ventilation & climate control', 'wind', 12],
      ['ICT & Network Infrastructure', 'Wi-Fi access points, LAN sockets, smart boards & servers', 'wifi', 8],
      ['Carpentry & Furniture', 'Doors, locks, desks, chairs, windows & cabinetry', 'hammer', 24],
      ['Civil & Building Works', 'Masonry, wall cracks, painting, roofing & flooring', 'building', 48]
    ];

    for (const c of cats) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO categories (name, description, icon, sla_hours) VALUES (?, ?, ?, ?)',
          args: c
        });
      } catch (e) {}
    }

    // Seed System Users (Admin, Management, Technicians)
    console.log('🔑 Seeding official System Admin, Management & Technician accounts into Turso...');

    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const systemUsers = [
      ['Admin Operations', 'admin@cosmopolitan.edu.ng', defaultPasswordHash, 'admin', 1, '+234 803 111 2233', 'System Administration'],
      ['Vice Chancellor Management', 'management@cosmopolitan.edu.ng', defaultPasswordHash, 'management', 1, '+234 802 999 8877', 'Executive Operations'],
      ['HVAC Technician Ibrahim', 'tech.hvac@cosmopolitan.edu.ng', defaultPasswordHash, 'technician', 2, '+234 805 444 3322', 'HVAC Air Conditioning & Cooling'],
      ['Electrical Technician Kabiru', 'tech.electrical@cosmopolitan.edu.ng', defaultPasswordHash, 'technician', 3, '+234 806 555 4433', 'Electrical Power & Generators'],
      ['ICT Support Engineer Sani', 'tech.ict@cosmopolitan.edu.ng', defaultPasswordHash, 'technician', 1, '+234 807 666 5544', 'Network Systems & Smartboards']
    ];

    for (const u of systemUsers) {
      try {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO users (name, email, password_hash, role, department_id, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: u
        });
      } catch (e) {
        console.warn('User insert warning:', e.message);
      }
    }

    console.log('🎉 Turso Cloud Database fully seeded with Admin & System Accounts!');
  } catch (err) {
    console.error('❌ Turso setup error:', err);
  }
}

initTurso();
