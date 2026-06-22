import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { adminService } from '../services/index.js';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

const emptySnapshot = {
  analytics: {
    totalUsers: 0,
    studentsCount: 0,
    adminsCount: 0,
    activeUsers: 0,
    totalCourses: 0,
    totalAssessments: 0,
    totalCertificates: 0,
    completionRate: 0,
    aiSessions: 0,
  },
  timeline: [],
  activities: [],
  students: [],
  teachers: [],
  courses: [],
  categories: [],
  resources: [],
  tests: [],
  questions: [],
  results: [],
  tasks: [],
  certificates: [],
  aiLogs: [],
  roles: [],
  lastUpdated: null,
};

export function useAdminData(pollIntervalMs = 15000) {
  const [data, setData] = useState(emptySnapshot);
  const [settings, setSettings] = useState(null);
  const [support, setSupport] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [live, setLive] = useState(false);
  const mounted = useRef(true);

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [dashboardRes, settingsRes, supportRes, cmsRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getSettings(),
        adminService.getSupport(),
        adminService.getCmsPosts(),
      ]);

      if (!mounted.current) return;

      setData(dashboardRes.data?.data || emptySnapshot);
      setSettings(settingsRes.data?.data || null);
      setSupport(supportRes.data?.data || []);
      setBlogs(cmsRes.data?.data || []);
      setError('');
    } catch (err) {
      if (!mounted.current) return;
      setError(err.response?.data?.message || err.message || 'Failed to load admin data');
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchAll();

    // Don’t let websocket connection failures break the admin page.
    // Even when socket is down, we still poll periodically via fetchAll(true).
    const socket = io(SOCKET_URL, {
      // Let socket.io negotiate; ordering still biases websocket.
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setLive(true);
      socket.emit('join-admin');
    });

    socket.on('connect_error', err => {
      setLive(false);
      // Keep console useful but avoid noisy crashes.
      console.warn('Admin socket connect_error:', err?.message || err);
    });

    socket.on('disconnect', () => setLive(false));
    socket.on('admin-update', () => fetchAll(true));

    const poll = setInterval(() => fetchAll(true), pollIntervalMs);

    return () => {
      mounted.current = false;
      clearInterval(poll);
      socket.disconnect();
    };
  }, [fetchAll, pollIntervalMs]);

  return {
    ...data,
    settings,
    support,
    blogs,
    loading,
    refreshing,
    error,
    live,
    refresh: () => fetchAll(false),
  };
}

export default useAdminData;
