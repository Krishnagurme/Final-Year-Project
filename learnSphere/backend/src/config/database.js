import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dns from 'dns';
import { seedDatabase } from '../utils/seed.js';

// Capture whatever DNS servers the OS is configured with BEFORE we override them.
// Atlas uses an SRV record (mongodb+srv://) whose lookup can fail intermittently
// (querySrv ENOTFOUND / ECONNREFUSED) depending on which resolver answers — so we
// rotate through the system resolver and public resolvers across retries.
const SYSTEM_DNS = (() => {
  try {
    return dns.getServers();
  } catch {
    return [];
  }
})();
const DNS_PLANS = [SYSTEM_DNS, ['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']].filter(
  plan => plan && plan.length
);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let mongoServer;

async function tryConnect(uri, label, { attempts = 1 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    const plan = DNS_PLANS[i % DNS_PLANS.length] || SYSTEM_DNS;
    try {
      if (plan.length) dns.setServers(plan);
    } catch {
      // ignore invalid resolver lists
    }
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      console.log(`✅ MongoDB connected to: ${label}${plan.length ? ` (dns: ${plan.join(', ')})` : ''}`);
      await seedDatabase();
      return;
    } catch (err) {
      lastErr = err;
      console.warn(
        `⚠️ Attempt ${i + 1}/${attempts} to connect to ${label} failed${plan.length ? ` via dns ${plan.join(', ')}` : ''}: ${err.message}`
      );
      if (i < attempts - 1) await wait(1000);
    }
  }
  throw lastErr;
}

export async function connectDatabase() {
  const candidates = [
    process.env.MONGODB_URI && {
      uri: process.env.MONGODB_URI,
      label: 'configured cluster',
      attempts: DNS_PLANS.length * 2, // rotate resolvers a couple of times before giving up
    },
    { uri: 'mongodb://127.0.0.1:27017/learnsphere', label: 'local MongoDB', attempts: 1 },
  ].filter(Boolean);

  for (const { uri, label, attempts } of candidates) {
    try {
      await tryConnect(uri, label, { attempts });
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
