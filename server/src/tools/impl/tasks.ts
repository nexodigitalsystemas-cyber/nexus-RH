import { db } from '../../db/index.js';

export function createTask(args: {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  type?: string;
}) {
  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, type, priority, category, created_at, updated_at)
    VALUES (?, ?, 'pending', ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    args.title,
    args.description || '',
    args.type || 'custom',
    args.priority || 'medium',
    args.category || 'RH'
  );

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
}

export function listTasks(args: { status?: string; category?: string; limit?: number }) {
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const params: unknown[] = [];

  if (args.status) { sql += ' AND status = ?'; params.push(args.status); }
  if (args.category) { sql += ' AND category = ?'; params.push(args.category); }
  sql += ' ORDER BY created_at DESC';
  if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }

  return db.prepare(sql).all(...params);
}

export function updateTaskStatus(args: { id: number; status: string }) {
  db.prepare('UPDATE tasks SET status = ?, updated_at = datetime("now") WHERE id = ?').run(args.status, args.id);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(args.id);
}
