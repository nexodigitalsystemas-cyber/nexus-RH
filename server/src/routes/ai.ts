import type { FastifyInstance } from 'fastify';
import { checkOllamaStatus, chatNonStreaming, getOllamaConfig, streamChat } from '../services/ollama.js';
import type { AIChatRequest } from '../types/index.js';

export async function aiRoutes(fastify: FastifyInstance) {
  // GET /api/ai/status — verifica conexão com Ollama
  fastify.get('/status', async (request, reply) => {
    const url = (request.query as { url?: string }).url;
    const status = await checkOllamaStatus(url);
    reply.status(status.ok && !status.error ? 200 : 503).send(status);
  });

  // POST /api/ai/chat — chat com streaming opcional via SSE
  fastify.post('/chat', async (request, reply) => {
    const body = request.body as AIChatRequest;
    const config = getOllamaConfig();

    if (!Array.isArray(body.messages)) {
      return reply.status(400).send({ error: 'messages deve ser um array' });
    }

    // Se stream=false, retorna resposta completa em JSON
    if (body.stream === false) {
      try {
        const content = await chatNonStreaming(config, body);
        return { content };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return reply.status(502).send({ error: message });
      }
    }

    // Streaming via SSE
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      for await (const chunk of streamChat(config, body)) {
        reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      reply.raw.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      reply.raw.write(`data: ${JSON.stringify({ error: message })}\n\n`);
    } finally {
      reply.raw.end();
    }
  });

  // GET /api/ai/config — retorna configuração atual (sem segredos)
  fastify.get('/config', async (_request, reply) => {
    const config = getOllamaConfig();
    return {
      model: config.model,
      baseUrl: config.baseUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    };
  });
}
