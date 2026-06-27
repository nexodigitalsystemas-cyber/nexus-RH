import type { Task, ProcessedFile, Candidate } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AIStatusResponse {
  ok: boolean;
  model?: string;
  error?: string;
  models?: string[];
}

export interface AIConfigResponse {
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
}

export interface AgentToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface AgentResponse {
  response: string;
  actions: AgentToolCall[];
}

export interface Report {
  id: number;
  name: string;
  type: 'excel' | 'pdf';
  status: 'pronto' | 'gerando' | 'erro';
  description: string;
  file_path?: string;
  file_size?: number;
  created_at: string;
}

export interface DashboardMetrics {
  tasksCompleted: number;
  tasksTotal: number;
  efficiency: number;
  timeSaved: number;
  filesProcessed: number;
  pendingTasks: number;
  pendingBreakdown: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Erro desconhecido');
    throw new Error(text);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ─── AI ─── */

export async function getAIStatus(url?: string): Promise<AIStatusResponse> {
  const query = url ? `?url=${encodeURIComponent(url)}` : '';
  return request<AIStatusResponse>(`/api/ai/status${query}`);
}

export async function getAIConfig(): Promise<AIConfigResponse> {
  return request<AIConfigResponse>('/api/ai/config');
}

export async function chatNonStreaming(messages: ChatMessage[]): Promise<{ content: string }> {
  return request<{ content: string }>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, stream: false }),
  });
}

export function chatStream(messages: ChatMessage[]): EventSource {
  const url = new URL(`${API_URL}/api/ai/chat`);
  url.searchParams.set('messages', JSON.stringify(messages));
  return new EventSource(url.toString());
}

export async function sendAgentMessage(messages: ChatMessage[]): Promise<AgentResponse> {
  return request<AgentResponse>('/api/agent/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}

/* ─── Tasks ─── */

export async function getTasks(): Promise<Task[]> {
  return request<Task[]>('/api/tasks');
}

export async function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  return request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateTask(id: number, data: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteTask(id: number): Promise<void> {
  return request<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}

/* ─── Files ─── */

export async function getFiles(params?: { folder?: string; status?: string; search?: string }): Promise<ProcessedFile[]> {
  const query = new URLSearchParams();
  if (params?.folder) query.set('folder', params.folder);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  return request<ProcessedFile[]>(`/api/files?${query.toString()}`);
}

export async function createFile(data: Omit<ProcessedFile, 'id' | 'created_at'>): Promise<ProcessedFile> {
  return request<ProcessedFile>('/api/files', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateFile(id: number, data: Partial<Omit<ProcessedFile, 'id' | 'created_at'>>): Promise<ProcessedFile> {
  return request<ProcessedFile>(`/api/files/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteFile(id: number): Promise<ProcessedFile> {
  return request<ProcessedFile>(`/api/files/${id}`, { method: 'DELETE' });
}

/* ─── Reports ─── */

export async function getReports(params?: { type?: string; status?: string; search?: string }): Promise<Report[]> {
  const query = new URLSearchParams();
  if (params?.type) query.set('type', params.type);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  return request<Report[]>(`/api/reports?${query.toString()}`);
}

export async function createReport(data: Omit<Report, 'id' | 'created_at'>): Promise<Report> {
  return request<Report>('/api/reports', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateReport(id: number, data: Partial<Omit<Report, 'id' | 'created_at'>>): Promise<Report> {
  return request<Report>(`/api/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteReport(id: number): Promise<void> {
  return request<void>(`/api/reports/${id}`, { method: 'DELETE' });
}

/* ─── Candidates ─── */

export async function getCandidates(search?: string): Promise<Candidate[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request<Candidate[]>(`/api/candidates${query}`);
}

export async function createCandidate(data: Omit<Candidate, 'id' | 'created_at'>): Promise<Candidate> {
  return request<Candidate>('/api/candidates', { method: 'POST', body: JSON.stringify(data) });
}

/* ─── Dashboard ─── */

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const tasks = await getTasks();
  const files = await getFiles({ status: 'active' });

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const total = tasks.length;
  const pending = tasks.filter((t) => t.status === 'pending').length;
  const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length;
  const high = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;
  const mediumLow = pending - urgent - high;

  return {
    tasksCompleted: completed,
    tasksTotal: total || 1,
    efficiency: 87,
    timeSaved: Number(((completed / (total || 1)) * 8).toFixed(1)),
    filesProcessed: files.length,
    pendingTasks: pending,
    pendingBreakdown: `${urgent} urgentes · ${high} medias · ${Math.max(0, mediumLow)} baixas`,
  };
}
