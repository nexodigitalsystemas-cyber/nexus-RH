import type { FastifyInstance } from 'fastify';
import { runAgent } from '../services/agent.js';
import type { ChatMessage } from '../types/index.js';

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.post('/chat', async (request, reply) => {
    const body = request.body as { messages?: ChatMessage[] };

    if (!Array.isArray(body.messages)) {
      return reply.status(400).send({ error: 'messages deve ser um array' });
    }

    try {
      const result = await runAgent({ messages: body.messages });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return reply.status(502).send({ error: message });
    }
  });
}
