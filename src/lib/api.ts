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
  role: 'system' | 'user' | 'assistant';
  content: string;
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

  return res.json() as Promise<T>;
}

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
  // SSE com POST não é suportado nativamente pelo EventSource;
  // usamos GET com query parameter codificado para streaming simples.
  url.searchParams.set('messages', JSON.stringify(messages));
  return new EventSource(url.toString());
}
