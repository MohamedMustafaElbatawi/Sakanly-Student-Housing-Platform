import mongoose from 'mongoose';
import { config } from './index.js';

// Cache connection in global scope for serverless environments (e.g. Vercel)
// to reuse database connections across warm lambda invocations.
let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null, listenersAttached: false };
}

/**
 * Connect to MongoDB Atlas (or configured URI) with serverless connection pooling
 * and graceful fallback.
 */
export const connectDB = async (customUri = null, customOpts = {}) => {
  // 1. If connection is already open and ready, return immediately
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return true;
  }

  // 2. If disconnected, disconnecting, or in stale error state, clean up so fresh connection can be initiated
  if (mongoose.connection && mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
    cached.conn = null;
    cached.promise = null;
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        // Safe ignore
      }
    }
  }

  const uri = customUri || config.mongoUri || process.env.MONGODB_URI || process.env.MONGO_URI;

  const isProd = Boolean(
    config.isProduction ||
    config.nodeEnv === 'production' ||
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );

  if (!uri) {
    cached.conn = null;
    cached.promise = null;
    if (isProd) {
      const err = new Error('MONGODB_URI is required in production environment.');
      console.error('❌ [Database] MONGODB_URI is not set in production environment.');
      throw err;
    }
    console.log('⚠️ [Database] MONGODB_URI / MONGO_URI is not set in environment.');
    console.log('💡 [Database] Running in In-Memory fallback mode. To persist data to MongoDB Atlas, add MONGODB_URI to server/.env');
    return false;
  }

  // 3. Attach listeners only once
  if (!cached.listenersAttached) {
    mongoose.connection.on('connected', () => {
      console.log('✅ [Database] MongoDB Atlas connected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      cached.conn = null;
      cached.promise = null;
      console.error('❌ [Database] MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      cached.conn = null;
      cached.promise = null;
      console.warn('⚠️ [Database] MongoDB disconnected.');
    });

    mongoose.connection.on('close', () => {
      cached.conn = null;
      cached.promise = null;
    });

    cached.listenersAttached = true;
  }

  // 4. If connection is already in flight (concurrent requests), reuse the existing promise
  if (!cached.promise) {
    mongoose.set('bufferCommands', false);

    const defaultTimeout = isProd ? 5000 : 15000;
    const opts = {
      serverSelectionTimeoutMS: customOpts.serverSelectionTimeoutMS || defaultTimeout,
      autoIndex: !isProd, // Disable auto-indexing in production to avoid cold-start overhead
      maxPoolSize: 10,
      minPoolSize: 0,
      socketTimeoutMS: 45000,
      ...customOpts,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      if (mongoose.connection.readyState === 1) {
        cached.conn = mongooseInstance;
        return mongooseInstance;
      }
      cached.conn = null;
      cached.promise = null;
      throw new Error('MongoDB readyState is not connected after connect resolved.');
    }).catch((err) => {
      cached.promise = null;
      cached.conn = null;
      throw err;
    });
  }

  try {
    await cached.promise;
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      cached.conn = mongoose;
      return true;
    }
    cached.conn = null;
    cached.promise = null;
    if (isProd) {
      throw new Error('MongoDB connection readyState is not 1 after resolution.');
    }
    return false;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error('❌ [Database] Failed to connect to MongoDB:', error.message);
    if (isProd) {
      throw error;
    }
    console.log('🛡️ [Database] Falling back to safe In-Memory mode so the server remains active in development.');
    return false;
  }
};

/**
 * Returns true strictly if MongoDB connection readyState === 1 (connected).
 * Never relies on stale booleans.
 */
export const isMongoConnected = () => {
  return Boolean(mongoose.connection && mongoose.connection.readyState === 1);
};

/**
 * Disconnect from MongoDB and reset cache
 */
export const disconnectDB = async () => {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (cached) {
    cached.conn = null;
    cached.promise = null;
  }
  console.log('🔌 [Database] MongoDB disconnected.');
};
