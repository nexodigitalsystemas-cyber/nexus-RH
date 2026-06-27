import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export async function settingsRoutes(fastify: FastifyInstance) {
  fastify.get('/', (_request, reply) => {
    const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
    const settings: Record<string, string> = {};
    rows.forEach((row) => { settings[row.key] = row.value; });
    return settings;
  });

  fastify.get('/:key', (request, reply) => {
    const { key } = request.params as { key: string };
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    if (!row) return reply.status(404).send({ error: 'Configuração não encontrada' });
    return { key, value: row.value };
  });

  fastify.put('/:key', (request, reply) => {
    const { key } = request.params as { key: string };
    const { value } = request.body as { value: string };

    db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value);

    return { key, value };
  });

  fastify.put('/', (request, reply) => {
    const body = request.body as Record<string, string>;
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    const tx = db.transaction(() => {
      Object.entries(body).forEach(([key, value]) => stmt.run(key, value));
    });
    tx();

    return body;
  });
}
