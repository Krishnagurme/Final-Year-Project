import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  HardDrive,
  Activity,
  Database,
  Globe,
  Zap,
  Clock,
  RefreshCw,
  Server,
  MemoryStick,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

const RuntimeMetrics = ({ metrics, loading, onRefresh, onReset }) => {
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    let interval;
    if (autoRefresh && onRefresh) {
      interval = setInterval(onRefresh, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center text-slate-500 py-12">
        <Server size={48} className="mx-auto mb-4 text-slate-300" />
        <p>No runtime data available</p>
      </div>
    );
  }

  const { system, process, disk, api, database } = metrics;

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'text-emerald-600';
    if (percentage < 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getUsageBgColor = (percentage) => {
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 75) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Runtime Metrics</h3>
          <p className="text-xs text-slate-500 mt-1">
            Last updated: {new Date(metrics.timestamp).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              autoRefresh
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={onRefresh}
            className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
          >
            <RefreshCw size={16} className="text-slate-600" />
          </button>
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-100 text-red-600 hover:bg-red-200 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cpu size={20} className="text-blue-600" />
            </div>
            <span className={`text-xs font-bold ${getUsageColor(parseFloat(system.cpu.usage))}`}>
              {system.cpu.usage}%
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">CPU Usage</h4>
          <p className="text-xs text-slate-500">{system.cpu.cores} cores</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${getUsageBgColor(parseFloat(system.cpu.usage))} transition-all duration-500`}
              style={{ width: `${system.cpu.usage}%` }}
            />
          </div>
        </motion.div>

        {/* Memory */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <MemoryStick size={20} className="text-purple-600" />
            </div>
            <span className={`text-xs font-bold ${getUsageColor(parseFloat(system.memory.usagePercent))}`}>
              {system.memory.usagePercent}%
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">Memory</h4>
          <p className="text-xs text-slate-500">
            {system.memory.used} / {system.memory.total}
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${getUsageBgColor(parseFloat(system.memory.usagePercent))} transition-all duration-500`}
              style={{ width: `${system.memory.usagePercent}%` }}
            />
          </div>
        </motion.div>

        {/* API Requests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Activity size={20} className="text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-slate-600">
              {api.requestsPerSecond}/s
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">API Requests</h4>
          <p className="text-xs text-slate-500">{api.totalRequests} total</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, api.requestsPerSecond * 10)}%` }}
            />
          </div>
        </motion.div>

        {/* Database */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Database size={20} className="text-amber-600" />
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                database.status === 'connected'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {database.status}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">Database</h4>
          <p className="text-xs text-slate-500">{database.collections} collections</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${database.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'} transition-all duration-500`}
              style={{ width: database.status === 'connected' ? '100%' : '0%' }}
            />
          </div>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Details */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Server size={16} className="text-slate-600" />
            System Details
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Platform</span>
              <span className="font-semibold text-slate-800">{system.system.platform}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Architecture</span>
              <span className="font-semibold text-slate-800">{system.system.arch}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Uptime</span>
              <span className="font-semibold text-slate-800">{system.system.uptime}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Load Average</span>
              <span className="font-semibold text-slate-800">
                {system.loadAverage.map(l => l.toFixed(2)).join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Process Details */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-slate-600" />
            Process Details
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">PID</span>
              <span className="font-semibold text-slate-800">{process.pid}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Node Version</span>
              <span className="font-semibold text-slate-800">{process.nodeVersion}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Process Uptime</span>
              <span className="font-semibold text-slate-800">{process.uptime}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Heap Used</span>
              <span className="font-semibold text-slate-800">{process.memory.heapUsed}</span>
            </div>
          </div>
        </div>

        {/* API Performance */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Globe size={16} className="text-slate-600" />
            API Performance
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Total Requests</span>
              <span className="font-semibold text-slate-800">{api.totalRequests}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Success Rate</span>
              <span className="font-semibold text-emerald-600">{api.successRate}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Avg Response Time</span>
              <span className="font-semibold text-slate-800">{api.averageResponseTime}ms</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Active Connections</span>
              <span className="font-semibold text-slate-800">{api.activeConnections}</span>
            </div>
          </div>
        </div>

        {/* Database Details */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-xl">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Database size={16} className="text-slate-600" />
            Database Details
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Status</span>
              <span
                className={`font-semibold ${
                  database.status === 'connected' ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {database.status}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Database</span>
              <span className="font-semibold text-slate-800">{database.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Data Size</span>
              <span className="font-semibold text-slate-800">{database.dataSize}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Indexes</span>
              <span className="font-semibold text-slate-800">{database.indexes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuntimeMetrics;
