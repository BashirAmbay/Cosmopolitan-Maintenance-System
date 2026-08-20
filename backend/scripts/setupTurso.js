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

    console.log('✅ ALL 11 tables ready on Turso Cloud Database!');

    // 1. All 8 Official Departments
    const departments = [
      ['Computer Science & IT', 'CSIT', 'School of Science & Technology', 'Dr. Amina Bello'],
      ['Law & Legal Studies', 'LAWS', 'Faculty of Law', 'Prof. Olumide Akande'],
      ['Business Administration', 'BUSM', 'Faculty of Management Sciences', 'Dr. Fatima Danjuma'],
      ['Nursing & Medical Sciences', 'NURS', 'College of Health Sciences', 'Dr. Grace Eze'],
      ['Electrical & Electronic Engineering', 'EEEE', 'Faculty of Engineering', 'Engr. Kabiru Usman'],
      ['University Administration', 'UNAD', 'Central Executive Administration', 'Registrar Office'],
      ['Library & Information Services', 'LIBR', 'Central University Library', 'Mrs. Victoria Nnamdi'],
      ['Estates & Facilities Management', 'ESTM', 'Physical Planning & Maintenance Unit', 'Arch. Suleiman Garba']
    ];

    for (const d of departments) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO departments (name, code, description, head_name) VALUES (?, ?, ?, ?)',
          args: d
        });
      } catch (e) {}
    }

    // 2. All 55 Campus Locations & Room Numbers
    const locations = [
      // Basement
      ['Room B.1', 'Cosmopolitan Campus Building', 'Basement (B)', 'B.1', 'Basement Floor - Room B.1'],
      ['Room B.2', 'Cosmopolitan Campus Building', 'Basement (B)', 'B.2', 'Basement Floor - Room B.2'],
      ['Room B.3', 'Cosmopolitan Campus Building', 'Basement (B)', 'B.3', 'Basement Floor - Room B.3'],
      ['Room B.4', 'Cosmopolitan Campus Building', 'Basement (B)', 'B.4', 'Basement Floor - Room B.4'],
      ['Room B.5', 'Cosmopolitan Campus Building', 'Basement (B)', 'B.5', 'Basement Floor - Room B.5'],
      // Ground Floor
      ['Room G.1', 'Cosmopolitan Campus Building', 'Ground Floor (GF)', 'G.1', 'Ground Floor - Room G.1'],
      ['Room G.2', 'Cosmopolitan Campus Building', 'Ground Floor (GF)', 'G.2', 'Ground Floor - Room G.2'],
      ['Room G.3', 'Cosmopolitan Campus Building', 'Ground Floor (GF)', 'G.3', 'Ground Floor - Room G.3'],
      ['Room G.4', 'Cosmopolitan Campus Building', 'Ground Floor (GF)', 'G.4', 'Ground Floor - Room G.4'],
      ['Room G.5', 'Cosmopolitan Campus Building', 'Ground Floor (GF)', 'G.5', 'Ground Floor - Room G.5'],
      ['Room G.6', 'Cosmopolitan Campus Building', 'Ground Floor (GF)', 'G.6', 'Ground Floor - Room G.6'],
      // 1st Floor
      ['Room 1.1', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.1', '1st Floor - Room 1.1'],
      ['Room 1.2', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.2', '1st Floor - Room 1.2'],
      ['Room 1.3', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.3', '1st Floor - Room 1.3'],
      ['Room 1.4', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.4', '1st Floor - Room 1.4'],
      ['Room 1.5', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.5', '1st Floor - Room 1.5'],
      ['Room 1.6', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.6', '1st Floor - Room 1.6'],
      ['Room 1.7', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.7', '1st Floor - Room 1.7'],
      ['Room 1.8', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.8', '1st Floor - Room 1.8'],
      ['Room 1.9', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.9', '1st Floor - Room 1.9'],
      ['Room 1.10', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.10', '1st Floor - Room 1.10'],
      ['Room 1.11', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.11', '1st Floor - Room 1.11'],
      ['Room 1.12', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.12', '1st Floor - Room 1.12'],
      ['Room 1.13', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.13', '1st Floor - Room 1.13'],
      ['Room 1.14', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.14', '1st Floor - Room 1.14'],
      ['Room 1.15', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.15', '1st Floor - Room 1.15'],
      ['Room 1.16', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.16', '1st Floor - Room 1.16'],
      ['Room 1.17', 'Cosmopolitan Campus Building', '1st Floor (Floor 1)', '1.17', '1st Floor - Room 1.17'],
      // 2nd Floor
      ['Room 2.1', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.1', '2nd Floor - Room 2.1'],
      ['Room 2.2', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.2', '2nd Floor - Room 2.2'],
      ['Room 2.3', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.3', '2nd Floor - Room 2.3'],
      ['Room 2.4', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.4', '2nd Floor - Room 2.4'],
      ['Room 2.5', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.5', '2nd Floor - Room 2.5'],
      ['Room 2.6', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.6', '2nd Floor - Room 2.6'],
      ['Room 2.7', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.7', '2nd Floor - Room 2.7'],
      ['Room 2.8', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.8', '2nd Floor - Room 2.8'],
      ['Room 2.9', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.9', '2nd Floor - Room 2.9'],
      ['Room 2.10', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.10', '2nd Floor - Room 2.10'],
      ['Room 2.11', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.11', '2nd Floor - Room 2.11'],
      ['Room 2.12', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.12', '2nd Floor - Room 2.12'],
      ['Room 2.13', 'Cosmopolitan Campus Building', '2nd Floor (Floor 2)', '2.13', '2nd Floor - Room 2.13'],
      // 3rd Floor
      ['Room 3.1', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.1', '3rd Floor - Room 3.1'],
      ['Room 3.2', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.2', '3rd Floor - Room 3.2'],
      ['Room 3.3', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.3', '3rd Floor - Room 3.3'],
      ['Room 3.4', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.4', '3rd Floor - Room 3.4'],
      ['Room 3.5', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.5', '3rd Floor - Room 3.5'],
      ['Room 3.6', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.6', '3rd Floor - Room 3.6'],
      ['Room 3.7', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.7', '3rd Floor - Room 3.7'],
      ['Room 3.8', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.8', '3rd Floor - Room 3.8'],
      ['Room 3.9', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.9', '3rd Floor - Room 3.9'],
      ['Room 3.10', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.10', '3rd Floor - Room 3.10'],
      ['Room 3.11', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.11', '3rd Floor - Room 3.11'],
      ['Room 3.12', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.12', '3rd Floor - Room 3.12'],
      ['Room 3.13', 'Cosmopolitan Campus Building', '3rd Floor (Floor 3)', '3.13', '3rd Floor - Room 3.13'],
      // Penthouse
      ['Room P.1', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.1', 'Penthouse Floor - Room P.1'],
      ['Room P.2', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.2', 'Penthouse Floor - Room P.2'],
      ['Room P.3', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.3', 'Penthouse Floor - Room P.3'],
      ['Room P.4', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.4', 'Penthouse Floor - Room P.4'],
      ['Room P.5', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.5', 'Penthouse Floor - Room P.5'],
      ['Room P.6', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.6', 'Penthouse Floor - Room P.6'],
      ['Room P.7', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.7', 'Penthouse Floor - Room P.7'],
      ['Room P.8', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.8', 'Penthouse Floor - Room P.8'],
      ['Room P.9', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.9', 'Penthouse Floor - Room P.9'],
      ['Room P.10', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.10', 'Penthouse Floor - Room P.10'],
      ['Room P.11', 'Cosmopolitan Campus Building', 'Penthouse Floor (PF)', 'P.11', 'Penthouse Floor - Room P.11']
    ];

    for (const l of locations) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO locations (name, building, floor, room_number, description) VALUES (?, ?, ?, ?, ?)',
          args: l
        });
      } catch (e) {}
    }

    // 3. All 8 Categories
    const categories = [
      ['Air Conditioning & HVAC', 'Split ACs, central cooling, fans, and ventilation faults', 'thermometer-snowflake', 12],
      ['Electrical & Power Systems', 'Lighting, sockets, circuit breakers, backup generators', 'zap', 8],
      ['Plumbing & Water Supply', 'Pipes, faucets, toilets, water pressure, leaks and drainage', 'droplet', 12],
      ['Furniture & Carpentry', 'Desks, chairs, whiteboards, podiums, doors, and cabinet repairs', 'armchair', 48],
      ['ICT, Network & Wi-Fi', 'Internet connectivity, access points, LAN sockets, server racks', 'wifi', 6],
      ['Audio/Visual & Projectors', 'Smart boards, ceiling projectors, microphones, sound systems', 'tv', 12],
      ['Janitorial & Sanitation', 'Cleaning requests, trash removal, chemical spills, hygiene', 'sparkles', 6],
      ['Security, Locks & Doors', 'Door locks, access control keycards, window latches, CCTV', 'lock', 4]
    ];

    for (const c of categories) {
      try {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO categories (name, description, icon, sla_hours) VALUES (?, ?, ?, ?)',
          args: c
        });
      } catch (e) {}
    }

    // 4. System Users (Admin, Management & Technicians)
    const defaultPasswordHash = await bcrypt.hash('password123', 10);
    const systemUsers = [
      ['Admin Operations', 'admin@cosmopolitan.edu.ng', defaultPasswordHash, 'admin', 6, '+234 803 111 2233', 'System Administration'],
      ['Vice Chancellor Management', 'management@cosmopolitan.edu.ng', defaultPasswordHash, 'management', 6, '+234 802 999 8877', 'Executive Operations'],
      ['HVAC Technician Ibrahim', 'tech.hvac@cosmopolitan.edu.ng', defaultPasswordHash, 'technician', 8, '+234 805 444 3322', 'HVAC Air Conditioning & Cooling'],
      ['Electrical Technician Kabiru', 'tech.electrical@cosmopolitan.edu.ng', defaultPasswordHash, 'technician', 5, '+234 806 555 4433', 'Electrical Power & Generators'],
      ['ICT Support Engineer Sani', 'tech.ict@cosmopolitan.edu.ng', defaultPasswordHash, 'technician', 1, '+234 807 666 5544', 'Network Systems & Smartboards']
    ];

    for (const u of systemUsers) {
      try {
        await client.execute({
          sql: 'INSERT OR REPLACE INTO users (name, email, password_hash, role, department_id, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)',
          args: u
        });
      } catch (e) {}
    }

    console.log('🎉 Turso Cloud Database populated with ALL 8 Departments, 8 Categories, 55 Campus Rooms & Admin Accounts!');
  } catch (err) {
    console.error('❌ Turso setup error:', err);
  }
}

initTurso();
