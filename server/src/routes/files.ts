import type { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';

export async function fileRoutes(fastify: FastifyInstance) {
  fastify.get('/', (request, reply) => {
    const { folder, status, search } = request.query as { folder?: string; status?: string; search?: string };
    let sql = 'SELECT * FROM files WHERE 1=1';
    const params: unknown[] = [];

    if (folder) { sql += ' AND folder = ?'; params.push(folder); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (search) { sql += ' AND (file_name LIKE ? OR extracted_text LIKE ? OR classification LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  });

  fastify.get('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (!file) return reply.status(404).send({ error: 'Arquivo não encontrado' });
    return file;
  });

  fastify.post('/', (request, reply) => {
    const body = request.body as {
      file_name: string;
      file_path: string;
      file_type: string;
      file_size?: number;
      extracted_text?: string;
      classification?: string;
      metadata?: string;
      folder?: string;
      category?: string;
    };

    if (!body.file_name || !body.file_path || !body.file_type) {
      return reply.status(400).send({ error: 'file_name, file_path e file_type são obrigatórios' });
    }

    const result = db.prepare(`
      INSERT INTO files (file_name, file_path, file_type, file_size, extracted_text, classification, metadata, folder, category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      body.file_name,
      body.file_path,
      body.file_type,
      body.file_size || 0,
      body.extracted_text || null,
      body.classification || null,
      body.metadata || null,
      body.folder || 'unclassified',
      body.category || 'unclassified'
    );

    const file = db.prepare('SELECT * FROM files WHERE id = ?').get(result.lastInsertRowid);
    return reply.status(201).send(file);
  });

  fastify.put('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      file_name: string;
      file_path: string;
      file_type: string;
      file_size: number;
      extracted_text: string;
      classification: string;
      metadata: string;
      folder: string;
      category: string;
      status: string;
    }>;

    const existing = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Arquivo não encontrado' });

    const fields: string[] = [];
    const values: unknown[] = [];

    const updatable = ['file_name', 'file_path', 'file_type', 'file_size', 'extracted_text', 'classification', 'metadata', 'folder', 'category', 'status'] as const;
    updatable.forEach((key) => {
      if (body[key] !== undefined) { fields.push(`${key} = ?`); values.push(body[key]); }
    });

    if (fields.length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });
    values.push(id);

    db.prepare(`UPDATE files SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
  });

  fastify.delete('/:id', (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    if (!existing) return reply.status(404).send({ error: 'Arquivo não encontrado' });

    db.prepare('UPDATE files SET status = ? WHERE id = ?').run('trash', id);
    return db.prepare('SELECT * FROM files WHERE id = ?').get(id);
  });
}
