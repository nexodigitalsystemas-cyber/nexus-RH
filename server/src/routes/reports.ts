import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.get('/', (request, reply) => {
    const { type, status, search } = request.query as { type?: string; status?: string; search?: string };
    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params: unknown[] = [];

    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  });

  fastify.get('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    if (!report) return reply.status(404).send({ error: 'Relatório não encontrado' });
    return report;
  });

  fastify.post('/', (request, reply) => {
    const body = request.body as {
      name: string;
      type: string;
      status?: string;
      description?: string;
      file_path?: string;
      file_size?: number;
    };

    if (!body.name || !body.type) {
      return reply.status(400).send({ error: 'name e type são obrigatórios' });
    }

    const result = db.prepare(`
      INSERT INTO reports (name, type, status, description, file_path, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      body.name,
      body.type,
      body.status || 'pronto',
      body.description || '',
      body.file_path || null,
      body.file_size || 0
    );

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
    return reply.status(201).send(report);
  });

  fastify.put('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      name: string;
      type: string;
      status: string;
      description: string;
      file_path: string;
      file_size: number;
    }>;

    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Relatório não encontrado' });

    const fields: string[] = [];
    const values: unknown[] = [];

    const updatable = ['name', 'type', 'status', 'description', 'file_path', 'file_size'] as const;
    updatable.forEach((key) => {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    });

    if (fields.length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });
    values.push(id);

    db.prepare(`UPDATE reports SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  });

  fastify.delete('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Relatório não encontrado' });

    db.prepare('DELETE FROM reports WHERE id = ?').run(id);
    return reply.status(204).send();
  });
}
