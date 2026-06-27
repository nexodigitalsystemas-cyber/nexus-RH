import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export async function taskRoutes(fastify: FastifyInstance) {
  fastify.get('/', (_request, reply) => {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
    return tasks;
  });

  fastify.get('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!task) return reply.status(404).send({ error: 'Tarefa não encontrada' });
    return task;
  });

  fastify.post('/', (request, reply) => {
    const body = request.body as {
      title: string;
      description?: string;
      status?: string;
      type?: string;
      priority?: string;
      category?: string;
      file_name?: string;
    };

    if (!body.title || body.title.trim().length < 3) {
      return reply.status(400).send({ error: 'Título deve ter pelo menos 3 caracteres' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (title, description, status, type, priority, category, file_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      body.title.trim(),
      body.description || '',
      body.status || 'pending',
      body.type || 'custom',
      body.priority || 'medium',
      body.category || 'RH',
      body.file_name || null
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    return reply.status(201).send(task);
  });

  fastify.put('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      title: string;
      description: string;
      status: string;
      type: string;
      priority: string;
      category: string;
      file_name: string;
    }>;

    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Tarefa não encontrada' });

    const fields: string[] = [];
    const values: unknown[] = [];

    if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
    if (body.description !== undefined) { fields.push('description = ?'); values.push(body.description); }
    if (body.status !== undefined) { fields.push('status = ?'); values.push(body.status); }
    if (body.type !== undefined) { fields.push('type = ?'); values.push(body.type); }
    if (body.priority !== undefined) { fields.push('priority = ?'); values.push(body.priority); }
    if (body.category !== undefined) { fields.push('category = ?'); values.push(body.category); }
    if (body.file_name !== undefined) { fields.push('file_name = ?'); values.push(body.file_name); }

    if (fields.length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });

    fields.push('updated_at = datetime("now")');
    values.push(id);

    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return task;
  });

  fastify.delete('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Tarefa não encontrada' });

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return reply.status(204).send();
  });
}
