import { Server } from 'socket.io';
import { runtimeMetricsService } from '../services/runtimeMetrics.service.js';
import mongoose from 'mongoose';

let io = null;
let runtimeMetricsInterval = null;

export function initAdminSocket(server, corsOrigins) {
  io = new Server(server, {
    cors: {
      origin: corsOrigins,
      credentials: true,
    },
  });

  io.on('connection', socket => {
    socket.on('join-admin', () => {
      socket.join('admin');
      // Send initial runtime metrics when admin joins
      sendRuntimeMetrics();
    });

    socket.on('leave-admin', () => {
      socket.leave('admin');
    });

    socket.on('request-runtime-metrics', async () => {
      await sendRuntimeMetrics();
    });
  });

  // Start periodic runtime metrics broadcast (every 5 seconds)
  startRuntimeMetricsBroadcast();

  return io;
}

async function sendRuntimeMetrics() {
  if (!io) return;
  try {
    const snapshot = await runtimeMetricsService.getRuntimeSnapshot(mongoose);
    io.to('admin').emit('runtime-metrics', {
      timestamp: new Date().toISOString(),
      data: snapshot,
    });
  } catch (error) {
    console.error('Error sending runtime metrics:', error);
  }
}

function startRuntimeMetricsBroadcast() {
  // Clear existing interval if any
  if (runtimeMetricsInterval) {
    clearInterval(runtimeMetricsInterval);
  }

  // Broadcast runtime metrics every 5 seconds
  runtimeMetricsInterval = setInterval(() => {
    sendRuntimeMetrics();
  }, 5000);
}

export function stopRuntimeMetricsBroadcast() {
  if (runtimeMetricsInterval) {
    clearInterval(runtimeMetricsInterval);
    runtimeMetricsInterval = null;
  }
}

export function broadcastAdminUpdate(event = 'refresh', payload = {}) {
  if (!io) return;
  io.to('admin').emit('admin-update', {
    event,
    ...payload,
    timestamp: new Date().toISOString(),
  });
}
