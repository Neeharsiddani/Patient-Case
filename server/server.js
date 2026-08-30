import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';
import { seedDatabase } from './db/seed.js';
import { db } from './db/database.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Initialize Database Schema & Seed Initial Clinical Data
    await seedDatabase();

    // 2. Start Express HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🏥 MediMitra Clinical Backend Server Running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
      console.log(`🔒 Security: Helmet enabled, JWT RBAC, SQLite WAL`);
      console.log(`=======================================================`);
    });

    // 3. Graceful Shutdown Handlers
    const handleShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Closing MediMitra server safely...`);
      server.close(() => {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed cleanly.');
          }
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (err) {
    console.error('❌ Failed to start MediMitra backend server:', err);
    process.exit(1);
  }
}

startServer();
