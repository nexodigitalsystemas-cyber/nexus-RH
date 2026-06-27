import { db } from '../../db/index.js';

export function createCandidate(args: {
  name: string;
  email?: string;
  phone?: string;
  skills?: string;
  experience?: string;
  source_file?: string;
}) {
  const result = db.prepare(`
    INSERT INTO candidates (name, email, phone, skills, experience, source_file, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(args.name, args.email || null, args.phone || null, args.skills || null, args.experience || null, args.source_file || null);

  return db.prepare('SELECT * FROM candidates WHERE id = ?').get(result.lastInsertRowid);
}

export function listCandidates(args: { search?: string; limit?: number }) {
  let sql = 'SELECT * FROM candidates';
  const params: unknown[] = [];

  if (args.search) {
    sql += ' WHERE name LIKE ? OR email LIKE ? OR skills LIKE ?';
    params.push(`%${args.search}%`, `%${args.search}%`, `%${args.search}%`);
  }

  sql += ' ORDER BY created_at DESC';
  if (args.limit) { sql += ' LIMIT ?'; params.push(args.limit); }

  return db.prepare(sql).all(...params);
}
