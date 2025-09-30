import { useState, useEffect, useCallback } from 'react';
import { DateRange } from 'react-day-picker';
import { fetchAnalytics } from '@/lib/api/analytics';

export const useAnalytics = (dateRange: DateRange) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [branch, setBranch] = useState<string>();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAnalytics(dateRange, branch);
      setData(result);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch analytics'));
    } finally {
      setLoading(false);
    }
  }, [dateRange, branch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    branch,
    setBranch,
    refetch: fetchData,
  };
};
