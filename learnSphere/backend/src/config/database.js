import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { seedDatabase } from '../utils/seed.js';

let mongoServer;

async function tryConnect(uri, label) {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  });
  console.log('✅ MongoDB connected to:', label);
  await seedDatabase();
}

export async function connectDatabase() {
  const candidates = [
    process.env.MONGODB_URI && { uri: process.env.MONGODB_URI, label: 'configured cluster' },
    { uri: 'mongodb://127.0.0.1:27017/learnsphere', label: 'local MongoDB' },
  ].filter(Boolean);

  for (const { uri, label } of candidates) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await tryConnect(uri, label);
      return;
    } catch (err) {
      console.warn(`⚠️ Could not connect to ${label}:`, err.message);
    }
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    console.log('🚀 Starting MongoDB Memory Server for development fallback...');
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri('learnsphere');
    await tryConnect(memoryUri, 'in-memory development database');
    console.log('ℹ️  Accounts are cleared when the backend restarts in memory mode.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('🔄 Running without database - some features will be limited');
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});
