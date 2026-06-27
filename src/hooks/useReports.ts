import { useState, useEffect, useCallback } from 'react';
import type { Report } from '@/lib/api';
import { getReports, createReport as apiCreateReport, updateReport as apiUpdateReport, deleteReport as apiDeleteReport } from '@/lib/api';

export function useReports(params?: { type?: string; status?: string; search?: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReports(params);
      setReports(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }, [params?.type, params?.status, params?.search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const addReport = useCallback(async (report: Omit<Report, 'id' | 'created_at'>) => {
    const created = await apiCreateReport(report);
    setReports((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: number, data: Partial<Omit<Report, 'id' | 'created_at'>>) => {
    const updated = await apiUpdateReport(id, data);
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    await apiDeleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { reports, loading, error, refetch: fetchReports, addReport, update, remove };
}
