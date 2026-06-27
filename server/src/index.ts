import Fastify from 'fastify';
import cors from '@fastify/cors';
import './db/index.js';
import { aiRoutes } from './routes/ai.js';
import { taskRoutes } from './routes/tasks.js';
import { fileRoutes } from './routes/files.js';
import { reportRoutes } from './routes/reports.js';
import { candidateRoutes } from './routes/candidates.js';
import { settingsRoutes } from './routes/settings.js';
import { agentRoutes } from './routes/agent.js';

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
  await fastify.register(taskRoutes, { prefix: '/api/tasks' });
  await fastify.register(fileRoutes, { prefix: '/api/files' });
  await fastify.register(reportRoutes, { prefix: '/api/reports' });
  await fastify.register(candidateRoutes, { prefix: '/api/candidates' });
  await fastify.register(settingsRoutes, { prefix: '/api/settings' });
  await fastify.register(agentRoutes, { prefix: '/api/agent' });

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
