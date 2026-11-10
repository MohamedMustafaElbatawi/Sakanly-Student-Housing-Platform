import mongoose from 'mongoose';
import { config } from './index.js';

let isConnected = false;

export const connectDB = async () => {
  const uri = config.mongoUri || process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.log('⚠️ [Database] MONGODB_URI / MONGO_URI is not set in environment.');
    console.log('💡 [Database] Running in In-Memory fallback mode. To persist data to MongoDB Atlas, add MONGODB_URI to server/.env');
    isConnected = false;
    return false;
  }

  try {
    mongoose.set('bufferCommands', false);

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
      console.warn('⚠️ [Database] MongoDB disconnected. Falling back to memory cache.');
    });

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    isConnected = true;
    return true;
  } catch (error) {
    isConnected = false;
    console.error('❌ [Database] Failed to connect to MongoDB:', error.message);
    console.log('🛡️ [Database] Falling back to safe In-Memory mode so the server remains active.');
    return false;
  }
};

export const isMongoConnected = () => isConnected || mongoose.connection.readyState === 1;

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 [Database] MongoDB disconnected.');
  }
};

