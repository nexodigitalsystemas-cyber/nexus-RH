import Fastify from 'fastify';
import cors from '@fastify/cors';
import { aiRoutes } from './routes/ai.js';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function main() {
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await fastify.register(aiRoutes, { prefix: '/api/ai' });

  fastify.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  fastify.listen({ port: PORT, host: HOST }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Nexus AI server rodando em ${address}`);
  });
}

main();
