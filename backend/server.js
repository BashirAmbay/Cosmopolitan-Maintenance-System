import app from './src/app.js';
import dotenv from 'dotenv';
import { seedDatabase } from './src/database/seed.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Auto-seed on server boot to ensure initial data exists
seedDatabase().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`Cosmopolitan University Abuja O&M API Server Running`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[PORT CONFLICT] Port ${PORT} is already in use by a background Node process.`);
      console.log(`If you want to run 'npm run dev' manually in terminal, stop the background process or use another port.\n`);
    } else {
      console.error('Server error:', err);
    }
  });
}).catch(err => {
  console.error('Failed to seed and start server:', err);
  process.exit(1);
});
