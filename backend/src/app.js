import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import userRoutes from './routes/userRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { initDatabaseSchema } from './database/schema.js';
import { seedDatabase } from './database/seed.js';
import db from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & auto-seed if empty on start
try {
  initDatabaseSchema();
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;
  if (userCount === 0) {
    seedDatabase().catch(err => console.warn('Auto-seed warning:', err.message));
  }
} catch (err) {
  console.warn('Database initialization check warning:', err.message);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
const isVercel = Boolean(process.env.VERCEL || process.env.NOW_BUILDER);
const staticUploadsDir = isVercel ? path.join('/tmp', 'uploads') : path.join(__dirname, '../uploads');
try {
  if (fs.existsSync(staticUploadsDir)) {
    app.use('/uploads', express.static(staticUploadsDir));
  }
} catch (err) {
  console.warn('Static uploads mount check warning:', err.message);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Cosmopolitan University Abuja O&M API',
    timestamp: new Date().toISOString()
  });
});

// Root Landing Route to guide users accessing http://localhost:5000/ in browser
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Cosmopolitan University O&M System API</title>
        <style>
          body { font-family: 'Poppins', system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; padding: 1rem; }
          .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; border: 1px solid #334155; text-align: center; max-width: 520px; shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          .logo-badge { width: 64px; height: 64px; background: linear-gradient(135deg, #6E0A1E, #001A38); border-radius: 16px; margin: 0 auto 1.5rem auto; display: flex; align-items: center; justify-content: center; font-size: 28px; border: 1px solid #881337; }
          h1 { color: #ffffff; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.5rem 0; letter-spacing: 0.5px; }
          .subtitle { color: #fbbf24; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; tracking: 1px; margin-bottom: 1.5rem; }
          p { color: #94a3b8; font-size: 0.875rem; line-height: 1.6; margin: 0.5rem 0; }
          .btn { display: inline-block; margin-top: 1.5rem; background: linear-gradient(135deg, #6E0A1E, #001A38); color: white; padding: 0.85rem 1.75rem; border-radius: 0.75rem; text-decoration: none; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 10px 15px -3px rgba(110,10,30,0.4); transition: transform 0.2s; }
          .btn:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo-badge">🏛️</div>
          <h1>COSMOPOLITAN UNIVERSITY ABUJA</h1>
          <div class="subtitle">Operations & Maintenance API Server</div>
          <p>You are viewing the <strong>Express API Backend Server</strong> (Port 5000).</p>
          <p>To use the visual web application portal, click the button below to launch the Vite Frontend Interface (Port 5173):</p>
          <a class="btn" href="http://localhost:5173">Open Web Application Portal (Port 5173) &rarr;</a>
        </div>
      </body>
    </html>
  `);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.'
  });
});

export default app;
