import { dbRun, dbExec } from '../config/database.js';
import { initDatabaseSchema } from './schema.js';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  await initDatabaseSchema();

  console.log('Ensuring Cosmopolitan University Abuja setup data exists...');

  // 1. Departments
  const departments = [
    { name: 'Computer Science & IT', code: 'CSIT', head_name: 'Dr. Amina Bello', description: 'School of Science & Technology' },
    { name: 'Law & Legal Studies', code: 'LAWS', head_name: 'Prof. Olumide Akande', description: 'Faculty of Law' },
    { name: 'Business Administration', code: 'BUSM', head_name: 'Dr. Fatima Danjuma', description: 'Faculty of Management Sciences' },
    { name: 'Nursing & Medical Sciences', code: 'NURS', head_name: 'Dr. Grace Eze', description: 'College of Health Sciences' },
    { name: 'Electrical & Electronic Engineering', code: 'EEEE', head_name: 'Engr. Kabiru Usman', description: 'Faculty of Engineering' },
    { name: 'University Administration', code: 'UNAD', head_name: 'Registrar Office', description: 'Central Executive Administration' },
    { name: 'Library & Information Services', code: 'LIBR', head_name: 'Mrs. Victoria Nnamdi', description: 'Central University Library' },
    { name: 'Estates & Facilities Management', code: 'ESTM', head_name: 'Arch. Suleiman Garba', description: 'Physical Planning & Maintenance Unit' },
  ];

  await Promise.allSettled(departments.map(d =>
    dbRun('INSERT OR IGNORE INTO departments (name, code, description, head_name) VALUES (?, ?, ?, ?)', [
      d.name, d.code, d.description, d.head_name
    ])
  ));

  // 2. Real Campus Locations (Floors & Room Numbers)
  const locations = [
    // Basement (B)
    { name: 'Room B.1', building: 'Cosmopolitan Campus Building', floor: 'Basement (B)', room_number: 'B.1', description: 'Basement Floor - Room B.1' },
    { name: 'Room B.2', building: 'Cosmopolitan Campus Building', floor: 'Basement (B)', room_number: 'B.2', description: 'Basement Floor - Room B.2' },
    { name: 'Room B.3', building: 'Cosmopolitan Campus Building', floor: 'Basement (B)', room_number: 'B.3', description: 'Basement Floor - Room B.3' },
    { name: 'Room B.4', building: 'Cosmopolitan Campus Building', floor: 'Basement (B)', room_number: 'B.4', description: 'Basement Floor - Room B.4' },
    { name: 'Room B.5', building: 'Cosmopolitan Campus Building', floor: 'Basement (B)', room_number: 'B.5', description: 'Basement Floor - Room B.5' },

    // Ground Floor (GF)
    { name: 'Room G.1', building: 'Cosmopolitan Campus Building', floor: 'Ground Floor (GF)', room_number: 'G.1', description: 'Ground Floor - Room G.1' },
    { name: 'Room G.2', building: 'Cosmopolitan Campus Building', floor: 'Ground Floor (GF)', room_number: 'G.2', description: 'Ground Floor - Room G.2' },
    { name: 'Room G.3', building: 'Cosmopolitan Campus Building', floor: 'Ground Floor (GF)', room_number: 'G.3', description: 'Ground Floor - Room G.3' },
    { name: 'Room G.4', building: 'Cosmopolitan Campus Building', floor: 'Ground Floor (GF)', room_number: 'G.4', description: 'Ground Floor - Room G.4' },
    { name: 'Room G.5', building: 'Cosmopolitan Campus Building', floor: 'Ground Floor (GF)', room_number: 'G.5', description: 'Ground Floor - Room G.5' },
    { name: 'Room G.6', building: 'Cosmopolitan Campus Building', floor: 'Ground Floor (GF)', room_number: 'G.6', description: 'Ground Floor - Room G.6' },

    // 1st Floor (Floor 1)
    { name: 'Room 1.1', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.1', description: '1st Floor - Room 1.1' },
    { name: 'Room 1.2', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.2', description: '1st Floor - Room 1.2' },
    { name: 'Room 1.3', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.3', description: '1st Floor - Room 1.3' },
    { name: 'Room 1.4', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.4', description: '1st Floor - Room 1.4' },
    { name: 'Room 1.5', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.5', description: '1st Floor - Room 1.5' },
    { name: 'Room 1.6', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.6', description: '1st Floor - Room 1.6' },
    { name: 'Room 1.7', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.7', description: '1st Floor - Room 1.7' },
    { name: 'Room 1.8', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.8', description: '1st Floor - Room 1.8' },
    { name: 'Room 1.9', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.9', description: '1st Floor - Room 1.9' },
    { name: 'Room 1.10', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.10', description: '1st Floor - Room 1.10' },
    { name: 'Room 1.11', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.11', description: '1st Floor - Room 1.11' },
    { name: 'Room 1.12', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.12', description: '1st Floor - Room 1.12' },
    { name: 'Room 1.13', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.13', description: '1st Floor - Room 1.13' },
    { name: 'Room 1.14', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.14', description: '1st Floor - Room 1.14' },
    { name: 'Room 1.15', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.15', description: '1st Floor - Room 1.15' },
    { name: 'Room 1.16', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.16', description: '1st Floor - Room 1.16' },
    { name: 'Room 1.17', building: 'Cosmopolitan Campus Building', floor: '1st Floor (Floor 1)', room_number: '1.17', description: '1st Floor - Room 1.17' },

    // 2nd Floor (Floor 2)
    { name: 'Room 2.1', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.1', description: '2nd Floor - Room 2.1' },
    { name: 'Room 2.2', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.2', description: '2nd Floor - Room 2.2' },
    { name: 'Room 2.3', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.3', description: '2nd Floor - Room 2.3' },
    { name: 'Room 2.4', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.4', description: '2nd Floor - Room 2.4' },
    { name: 'Room 2.5', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.5', description: '2nd Floor - Room 2.5' },
    { name: 'Room 2.6', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.6', description: '2nd Floor - Room 2.6' },
    { name: 'Room 2.7', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.7', description: '2nd Floor - Room 2.7' },
    { name: 'Room 2.8', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.8', description: '2nd Floor - Room 2.8' },
    { name: 'Room 2.9', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.9', description: '2nd Floor - Room 2.9' },
    { name: 'Room 2.10', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.10', description: '2nd Floor - Room 2.10' },
    { name: 'Room 2.11', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.11', description: '2nd Floor - Room 2.11' },
    { name: 'Room 2.12', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.12', description: '2nd Floor - Room 2.12' },
    { name: 'Room 2.13', building: 'Cosmopolitan Campus Building', floor: '2nd Floor (Floor 2)', room_number: '2.13', description: '2nd Floor - Room 2.13' },

    // 3rd Floor (Floor 3)
    { name: 'Room 3.1', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.1', description: '3rd Floor - Room 3.1' },
    { name: 'Room 3.2', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.2', description: '3rd Floor - Room 3.2' },
    { name: 'Room 3.3', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.3', description: '3rd Floor - Room 3.3' },
    { name: 'Room 3.4', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.4', description: '3rd Floor - Room 3.4' },
    { name: 'Room 3.5', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.5', description: '3rd Floor - Room 3.5' },
    { name: 'Room 3.6', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.6', description: '3rd Floor - Room 3.6' },
    { name: 'Room 3.7', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.7', description: '3rd Floor - Room 3.7' },
    { name: 'Room 3.8', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.8', description: '3rd Floor - Room 3.8' },
    { name: 'Room 3.9', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.9', description: '3rd Floor - Room 3.9' },
    { name: 'Room 3.10', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.10', description: '3rd Floor - Room 3.10' },
    { name: 'Room 3.11', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.11', description: '3rd Floor - Room 3.11' },
    { name: 'Room 3.12', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.12', description: '3rd Floor - Room 3.12' },
    { name: 'Room 3.13', building: 'Cosmopolitan Campus Building', floor: '3rd Floor (Floor 3)', room_number: '3.13', description: '3rd Floor - Room 3.13' },

    // Penthouse Floor (PF)
    { name: 'Room P.1', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.1', description: 'Penthouse Floor - Room P.1' },
    { name: 'Room P.2', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.2', description: 'Penthouse Floor - Room P.2' },
    { name: 'Room P.3', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.3', description: 'Penthouse Floor - Room P.3' },
    { name: 'Room P.4', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.4', description: 'Penthouse Floor - Room P.4' },
    { name: 'Room P.5', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.5', description: 'Penthouse Floor - Room P.5' },
    { name: 'Room P.6', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.6', description: 'Penthouse Floor - Room P.6' },
    { name: 'Room P.7', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.7', description: 'Penthouse Floor - Room P.7' },
    { name: 'Room P.8', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.8', description: 'Penthouse Floor - Room P.8' },
    { name: 'Room P.9', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.9', description: 'Penthouse Floor - Room P.9' },
    { name: 'Room P.10', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.10', description: 'Penthouse Floor - Room P.10' },
    { name: 'Room P.11', building: 'Cosmopolitan Campus Building', floor: 'Penthouse Floor (PF)', room_number: 'P.11', description: 'Penthouse Floor - Room P.11' },
  ];

  await Promise.allSettled(locations.map(l =>
    dbRun('INSERT OR IGNORE INTO locations (name, building, floor, room_number, description) VALUES (?, ?, ?, ?, ?)', [
      l.name, l.building, l.floor, l.room_number, l.description
    ])
  ));

  // 3. Categories
  const categories = [
    { name: 'Air Conditioning & HVAC', description: 'Split ACs, central cooling, fans, and ventilation faults', icon: 'thermometer-snowflake', sla_hours: 12 },
    { name: 'Electrical & Power Systems', description: 'Lighting, sockets, circuit breakers, backup generators', icon: 'zap', sla_hours: 8 },
    { name: 'Plumbing & Water Supply', description: 'Pipes, faucets, toilets, water pressure, leaks and drainage', icon: 'droplet', sla_hours: 12 },
    { name: 'Furniture & Carpentry', description: 'Desks, chairs, whiteboards, podiums, doors, and cabinet repairs', icon: 'armchair', sla_hours: 48 },
    { name: 'ICT, Network & Wi-Fi', description: 'Internet connectivity, access points, LAN sockets, server racks', icon: 'wifi', sla_hours: 6 },
    { name: 'Audio/Visual & Projectors', description: 'Smart boards, ceiling projectors, microphones, sound systems', icon: 'tv', sla_hours: 12 },
    { name: 'Janitorial & Sanitation', description: 'Cleaning requests, trash removal, chemical spills, hygiene', icon: 'sparkles', sla_hours: 6 },
    { name: 'Security, Locks & Doors', description: 'Door locks, access control keycards, window latches, CCTV', icon: 'lock', sla_hours: 4 },
  ];

  await Promise.allSettled(categories.map(c =>
    dbRun('INSERT OR IGNORE INTO categories (name, description, icon, sla_hours) VALUES (?, ?, ?, ?)', [
      c.name, c.description, c.icon, c.sla_hours
    ])
  ));

  // 4. Official System Users
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [
    { name: 'Admin Operations', email: 'admin@cosmopolitan.edu.ng', role: 'admin', department_id: 6, phone: '+234 803 111 2233', specialization: 'System Administration' },
    { name: 'Vice Chancellor Management', email: 'management@cosmopolitan.edu.ng', role: 'management', department_id: 6, phone: '+234 802 999 8877', specialization: 'Executive Operations' },
    { name: 'Musa Ibrahim (Student)', email: 'musa.ibrahim@cosmopolitan.edu.ng', role: 'student', department_id: 1, phone: '+234 801 234 5678', specialization: null },
    { name: 'Dr. Amina Bello (Staff)', email: 'amina.bello@cosmopolitan.edu.ng', role: 'staff', department_id: 1, phone: '+234 802 345 6789', specialization: null },
    { name: 'Kabiru Usman (Technician)', email: 'kabiru.usman@cosmopolitan.edu.ng', role: 'technician', department_id: 8, phone: '+234 803 456 7890', specialization: 'Air Conditioning & HVAC' },
    { name: 'Emeka Okafor (Plumber)', email: 'emeka.okafor@cosmopolitan.edu.ng', role: 'technician', department_id: 8, phone: '+234 804 567 8901', specialization: 'Plumbing & Water Supply' },
  ];

  await Promise.allSettled(users.map(u =>
    dbRun('INSERT OR IGNORE INTO users (name, email, password_hash, role, department_id, phone, specialization) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      u.name, u.email, passwordHash, u.role, u.department_id, u.phone, u.specialization
    ])
  ));

  console.log('Database initialization check complete!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}
