import mongoose from 'mongoose';
import { config } from './index.js';

// Cache connection in global scope for serverless environments (e.g. Vercel)
// to reuse database connections across warm lambda invocations.
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, listenersAttached: false };
}

let isConnected = false;

export const connectDB = async () => {
  // 1. If connection is already open and ready, return immediately
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  // 2. If cached connection is already active, return true
  if (cached.conn && mongoose.connection.readyState === 1) {
    isConnected = true;
    return true;
  }

  const uri = config.mongoUri || process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    if (config.isProduction) {
      const err = new Error('MONGODB_URI is required in production environment.');
      console.error('❌ [Database] MONGODB_URI is not set in production environment.');
      throw err;
    }
    console.log('⚠️ [Database] MONGODB_URI / MONGO_URI is not set in environment.');
    console.log('💡 [Database] Running in In-Memory fallback mode. To persist data to MongoDB Atlas, add MONGODB_URI to server/.env');
    isConnected = false;
    return false;
  }

  // 3. Attach listeners only once
  if (!cached.listenersAttached) {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      console.log('✅ [Database] MongoDB Atlas connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      console.error('❌ [Database] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      console.warn('⚠️ [Database] MongoDB disconnected.');
    });

    cached.listenersAttached = true;
  }

  // 4. Create new connection promise if none is in progress
  if (!cached.promise) {
    mongoose.set('bufferCommands', false);

    const opts = {
      serverSelectionTimeoutMS: 5000,
      autoIndex: !config.isProduction, // Disable auto-indexing in production to avoid cold-start overhead
      maxPoolSize: 10,
      minPoolSize: 0,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      isConnected = true;
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    isConnected = true;
    return true;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    isConnected = false;
    console.error('❌ [Database] Failed to connect to MongoDB:', error.message);
    if (config.isProduction) {
      throw error;
    }
    console.log('🛡️ [Database] Falling back to safe In-Memory mode so the server remains active in development.');
    return false;
  }
};

export const isMongoConnected = () => isConnected || mongoose.connection.readyState === 1;

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    if (cached) {
      cached.conn = null;
      cached.promise = null;
    }
    console.log('🔌 [Database] MongoDB disconnected.');
  }
};


