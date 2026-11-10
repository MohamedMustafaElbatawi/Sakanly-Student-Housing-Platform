// Sakanly Production Ready Server
import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDB, disconnectDB } from './config/database.js';
import { runMigrations } from './services/migrationService.js';
import { SocketService } from './services/socketService.js';

const startServer = async () => {
  // Connect to MongoDB Atlas (safe dual-mode: falls back to in-memory if no URI provided)
  const connected = await connectDB();
  let migrationStatus = 'skipped';
  if (connected) {
    try {
      const res = await runMigrations();
      migrationStatus = res?.success ? 'completed' : 'failed';
    } catch (migErr) {
      migrationStatus = 'failed';
      console.error('❌ [Server] Migration aborted due to error:', migErr.message);
    }
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  SocketService.init(httpServer);

  const server = httpServer.listen(config.port, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 Sakanly Backend API running successfully!`);
    console.log(`📡 URL: http://localhost:${config.port} (bound to 0.0.0.0)`);
    console.log(`🩺 Health: http://localhost:${config.port}${config.apiPrefix}/health`);
    console.log(`🏡 Listings: http://localhost:${config.port}${config.apiPrefix}/listings`);
    console.log(`🌐 Environment: ${config.nodeEnv}`);
    console.log(`💾 Database: ${connected ? 'MongoDB Atlas' : 'In-Memory Resilient Store'}`);
    if (connected) {
      console.log(`🔄 Migration: ${migrationStatus === 'completed' ? 'Synced & Ready ✅' : 'Failed ❌'}`);
    }
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ [Server] Port ${config.port} is already in use by another process.`);
    } else {
      console.error('❌ [Server] HTTP server encountered an error:', err.message);
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Signal received: closing HTTP server and disconnecting DB...');
    server.close(async () => {
      await disconnectDB();
      console.log('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('❌ [Server] Uncaught Exception caught by top-level handler:', err.message);
  });
};

startServer();
