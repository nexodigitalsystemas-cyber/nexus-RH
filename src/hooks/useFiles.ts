import { useState, useEffect, useCallback } from 'react';
import type { ProcessedFile } from '@/types';
import { getFiles, updateFile as apiUpdateFile, deleteFile as apiDeleteFile } from '@/lib/api';

export function useFiles(params?: { folder?: string; status?: string; search?: string }) {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFiles(params);
      setFiles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar arquivos');
    } finally {
      setLoading(false);
    }
  }, [params?.folder, params?.status, params?.search]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const update = useCallback(async (id: number, data: Partial<Omit<ProcessedFile, 'id' | 'created_at'>>) => {
    const updated = await apiUpdateFile(id, data);
    setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
    return updated;
  }, []);

  const remove = useCallback(async (id: number) => {
    const updated = await apiDeleteFile(id);
    setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }, []);

  return { files, loading, error, refetch: fetchFiles, update, remove };
}
