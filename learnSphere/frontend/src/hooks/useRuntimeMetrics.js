import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../services/index.js';

export const useRuntimeMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRealtime, setIsRealtime] = useState(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getRuntimeSnapshot();
      setMetrics(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch runtime metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  const resetMetrics = useCallback(async () => {
    try {
      await adminService.resetRuntimeMetrics();
      await fetchMetrics();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset metrics');
    }
  }, [fetchMetrics]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    isRealtime,
    refetch: fetchMetrics,
    resetMetrics,
    setIsRealtime,
  };
};

export default useRuntimeMetrics;
