import os from 'os';
import fs from 'fs';

class RuntimeMetricsService {
  constructor() {
    this.requestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      endpoints: {},
      lastReset: new Date(),
    };
    this.activeConnections = 0;
    this.startTime = Date.now();
  }

  // System Metrics
  getSystemMetrics() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: {
        usage: this.getCPUUsage(),
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
      },
      memory: {
        total: this.formatBytes(totalMemory),
        used: this.formatBytes(usedMemory),
        free: this.formatBytes(freeMemory),
        usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2),
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: this.formatUptime(os.uptime()),
        hostname: os.hostname(),
      },
      loadAverage: os.loadavg(),
    };
  }

  // Process Metrics
  getProcessMetrics() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      memory: {
        rss: this.formatBytes(memoryUsage.rss),
        heapTotal: this.formatBytes(memoryUsage.heapTotal),
        heapUsed: this.formatBytes(memoryUsage.heapUsed),
        external: this.formatBytes(memoryUsage.external),
        arrayBuffers: this.formatBytes(memoryUsage.arrayBuffers),
      },
      uptime: this.formatUptime(uptime),
      pid: process.pid,
      version: process.version,
      nodeVersion: process.versions.node,
    };
  }

  // Disk Metrics
  getDiskMetrics() {
    try {
      const stats = fs.statSync('.');
      return {
        path: process.cwd(),
        type: 'filesystem',
        status: 'available',
      };
    } catch (error) {
      return {
        path: process.cwd(),
        type: 'filesystem',
        status: 'error',
        error: error.message,
      };
    }
  }

  // API Performance Metrics
  getAPIMetrics() {
    const now = Date.now();
    const uptime = (now - this.startTime) / 1000;

    return {
      totalRequests: this.requestMetrics.totalRequests,
      successfulRequests: this.requestMetrics.successfulRequests,
      failedRequests: this.requestMetrics.failedRequests,
      successRate: this.requestMetrics.totalRequests > 0
        ? ((this.requestMetrics.successfulRequests / this.requestMetrics.totalRequests) * 100).toFixed(2)
        : '0.00',
      averageResponseTime: this.requestMetrics.averageResponseTime.toFixed(2),
      requestsPerSecond: uptime > 0 ? (this.requestMetrics.totalRequests / uptime).toFixed(2) : '0.00',
      activeConnections: this.activeConnections,
      uptime: this.formatUptime(uptime),
      endpoints: this.requestMetrics.endpoints,
    };
  }

  // Database Connection Status
  async getDatabaseStatus(mongoose) {
    try {
      const state = mongoose.connection.readyState;
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
      };

      const dbStats = state === 1 ? await mongoose.connection.db.stats() : null;

      return {
        status: states[state] || 'unknown',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: dbStats?.collections || 0,
        dataSize: dbStats ? this.formatBytes(dbStats.dataSize) : 'N/A',
        storageSize: dbStats ? this.formatBytes(dbStats.storageSize) : 'N/A',
        indexes: dbStats?.indexes || 0,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  // Track API Request
  trackRequest(method, path, statusCode, responseTime) {
    this.requestMetrics.totalRequests++;

    if (statusCode >= 200 && statusCode < 400) {
      this.requestMetrics.successfulRequests++;
    } else {
      this.requestMetrics.failedRequests++;
    }

    // Update response times
    this.requestMetrics.responseTimes.push(responseTime);
    if (this.requestMetrics.responseTimes.length > 100) {
      this.requestMetrics.responseTimes.shift();
    }

    const avgResponseTime =
      this.requestMetrics.responseTimes.reduce((a, b) => a + b, 0) /
      this.requestMetrics.responseTimes.length;
    this.requestMetrics.averageResponseTime = avgResponseTime;

    // Track endpoint metrics
    const endpointKey = `${method} ${path}`;
    if (!this.requestMetrics.endpoints[endpointKey]) {
      this.requestMetrics.endpoints[endpointKey] = {
        requests: 0,
        successes: 0,
        failures: 0,
        avgResponseTime: 0,
        responseTimes: [],
      };
    }

    const endpoint = this.requestMetrics.endpoints[endpointKey];
    endpoint.requests++;
    endpoint.responseTimes.push(responseTime);
    if (endpoint.responseTimes.length > 50) {
      endpoint.responseTimes.shift();
    }

    if (statusCode >= 200 && statusCode < 400) {
      endpoint.successes++;
    } else {
      endpoint.failures++;
    }

    endpoint.avgResponseTime =
      endpoint.responseTimes.reduce((a, b) => a + b, 0) / endpoint.responseTimes.length;
  }

  // Update active connections
  updateActiveConnections(delta) {
    this.activeConnections = Math.max(0, this.activeConnections + delta);
  }

  // Reset metrics
  resetMetrics() {
    this.requestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      endpoints: {},
      lastReset: new Date(),
    };
    this.startTime = Date.now();
  }

  // Helper functions
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle / total);

    return usage.toFixed(2);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Get comprehensive runtime snapshot
  async getRuntimeSnapshot(mongoose) {
    return {
      timestamp: new Date().toISOString(),
      system: this.getSystemMetrics(),
      process: this.getProcessMetrics(),
      disk: this.getDiskMetrics(),
      api: this.getAPIMetrics(),
      database: await this.getDatabaseStatus(mongoose),
    };
  }
}

// Singleton instance
export const runtimeMetricsService = new RuntimeMetricsService();
export default runtimeMetricsService;
