import type { AIChatRequest, AIStatusResponse, OllamaConfig, OllamaTool } from '../types/index.js';

const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'llama3.2:3b',
  temperature: Number(process.env.OLLAMA_TEMPERATURE) || 0.7,
  maxTokens: Number(process.env.OLLAMA_MAX_TOKENS) || 2048,
};

export function getOllamaConfig(): OllamaConfig {
  return { ...DEFAULT_CONFIG };
}

export async function checkOllamaStatus(customUrl?: string): Promise<AIStatusResponse> {
  const baseUrl = (customUrl || DEFAULT_CONFIG.baseUrl).replace(/\/$/, '');

  try {
    const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    if (!res.ok) {
      return { ok: false, error: `Ollama respondeu com status ${res.status}` };
    }

    const data = (await res.json()) as { models?: Array<{ name: string }> };
    const models = data.models?.map((m) => m.name) ?? [];
    const targetModel = DEFAULT_CONFIG.model;

    if (models.length === 0) {
      return { ok: true, model: targetModel, models, error: 'Nenhum modelo encontrado' };
    }

    const hasModel = models.includes(targetModel);
    if (!hasModel) {
      return {
        ok: true,
        model: targetModel,
        models,
        error: `Modelo "${targetModel}" não está baixado. Modelos disponíveis: ${models.join(', ')}`,
      };
    }

    return { ok: true, model: targetModel, models };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Não foi possível conectar ao Ollama: ${message}` };
  }
}

export async function* streamChat(config: OllamaConfig, request: AIChatRequest): AsyncGenerator<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  const body = {
    model: config.model,
    messages: request.messages,
    stream: true,
    options: {
      temperature: config.temperature,
      num_predict: config.maxTokens,
    },
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => 'unknown error');
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
          if (parsed.done) return;
        } catch {
          // ignora linhas malformadas
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface ChatResponse {
  content: string;
  tool_calls?: Array<{
    id?: string;
    function: {
      name: string;
      arguments: Record<string, unknown>;
    };
  }>;
}

export async function chatWithTools(
  config: OllamaConfig,
  messages: AIChatRequest['messages'],
  tools: OllamaTool[],
): Promise<ChatResponse> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  const body = {
    model: config.model,
    messages,
    tools,
    stream: false,
    options: {
      temperature: config.temperature,
      num_predict: config.maxTokens,
    },
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error');
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    message?: {
      content?: string;
      tool_calls?: Array<{
        id?: string;
        function: {
          name?: string;
          arguments?: Record<string, unknown>;
        };
      }>;
    };
  };

  const tool_calls = data.message?.tool_calls
    ?.filter((tc) => tc.function?.name)
    .map((tc) => ({
      id: tc.id,
      function: {
        name: tc.function.name as string,
        arguments: tc.function.arguments ?? {},
      },
    }));

  return {
    content: data.message?.content || '',
    tool_calls,
  };
}

export async function chatNonStreaming(config: OllamaConfig, request: AIChatRequest): Promise<string> {
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  const body = {
    model: config.model,
    messages: request.messages,
    stream: false,
    options: {
      temperature: config.temperature,
      num_predict: config.maxTokens,
    },
  };

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown error');
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content || '';
}
