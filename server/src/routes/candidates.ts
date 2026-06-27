import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export async function candidateRoutes(fastify: FastifyInstance) {
  fastify.get('/', (request, reply) => {
    const { search } = request.query as { search?: string };
    let sql = 'SELECT * FROM candidates';
    const params: unknown[] = [];

    if (search) {
      sql += ' WHERE name LIKE ? OR email LIKE ? OR skills LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  });

  fastify.get('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!candidate) return reply.status(404).send({ error: 'Candidato não encontrado' });
    return candidate;
  });

  fastify.post('/', (request, reply) => {
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      skills?: string;
      experience?: string;
      source_file?: string;
    };

    const result = db.prepare(`
      INSERT INTO candidates (name, email, phone, skills, experience, source_file, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      body.name || null,
      body.email || null,
      body.phone || null,
      body.skills || null,
      body.experience || null,
      body.source_file || null
    );

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(result.lastInsertRowid);
    return reply.status(201).send(candidate);
  });

  fastify.put('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      name: string;
      email: string;
      phone: string;
      skills: string;
      experience: string;
      source_file: string;
    }>;

    const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Candidato não encontrado' });

    const fields: string[] = [];
    const values: unknown[] = [];

    const updatable = ['name', 'email', 'phone', 'skills', 'experience', 'source_file'] as const;
    updatable.forEach((key) => {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    });

    if (fields.length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });
    values.push(id);

    db.prepare(`UPDATE candidates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
  });

  fastify.delete('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Candidato não encontrado' });

    db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
    return reply.status(204).send();
  });
}
